import streamlit as st
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import google.generativeai as genai
from typing import List, Dict, Tuple
import time
import webbrowser
from datetime import datetime
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import mysql.connector
from mysql.connector import Error
import hashlib
import secrets
import string
import sys

from src.config import TICKERS, RISK_FREE_RATE
from src.data_loader import load_stock_data
from src.volatility import historical_volatility
from src.black_scholes import call_price
from src.greeks import calculate_greeks
from src.hedge import delta_hedge
from src.feature_engineering import generate_option_samples
from src.ml_model import train_model
from src.option_chain import load_option_chain
from src.vol_surface import approximate_vol_surface

# =============================
# DATABASE SETUP & AUTHENTICATION
# =============================

def create_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',  # Change if using different user
            password='aditya18',  # Your MySQL password
            database='options_analytics'
        )
        return connection
    except Error as e:
        # If database doesn't exist, try to create it
        if e.errno == 1049:  # Unknown database error
            try:
                # Connect without database
                connection = mysql.connector.connect(
                    host='localhost',
                    user='root',
                    password='aditya18'
                )
                return connection
            except Error as e2:
                st.error(f"Error connecting to MySQL server: {e2}")
                return None
        else:
            st.error(f"Error connecting to MySQL: {e}")
            return None

def init_database():
    """Initialize database and create tables if they don't exist"""
    try:
        # First try to connect to the database
        conn = create_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SHOW DATABASES LIKE 'options_analytics'")
        if not cursor.fetchone():
            # Create database
            cursor.execute("CREATE DATABASE options_analytics")
            st.success("Database 'options_analytics' created successfully")
        
        # Close connection and reconnect to the specific database
        cursor.close()
        conn.close()
        
        # Now connect to the specific database
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                salt VARCHAR(32) NOT NULL,
                full_name VARCHAR(100),
                company VARCHAR(100),
                role VARCHAR(50) DEFAULT 'user',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                subscription_type VARCHAR(50) DEFAULT 'free'
            )
        """)
        
        # Create user_sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id VARCHAR(100) PRIMARY KEY,
                user_id INT,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create user_preferences table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                default_ticker VARCHAR(10) DEFAULT 'AAPL',
                default_option_type VARCHAR(10) DEFAULT 'Call',
                default_expiry_days INT DEFAULT 30,
                default_history_years INT DEFAULT 5,
                theme VARCHAR(20) DEFAULT 'light',
                risk_tolerance VARCHAR(20) DEFAULT 'medium',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Create activity_log table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                activity_type VARCHAR(50),
                description TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # Check if demo user exists
        cursor.execute("SELECT id FROM users WHERE username = 'demo'")
        if not cursor.fetchone():
            # Create demo user
            import hashlib
            import secrets
            
            # Generate salt and hash for demo password
            salt = secrets.token_hex(16)
            password_hash = hashlib.sha256(('demo123' + salt).encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, salt, full_name, role)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, ('demo', 'demo@optionsanalytics.com', password_hash, salt, 'Demo User', 'admin'))
            
            # Get the demo user ID
            demo_user_id = cursor.lastrowid
            
            # Create preferences for demo user
            cursor.execute("""
                INSERT INTO user_preferences (user_id)
                VALUES (%s)
            """, (demo_user_id,))
            
            st.success("Demo user created: username='demo', password='demo123'")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return True
        
    except Error as e:
        st.error(f"Error initializing database: {e}")
        # Show troubleshooting steps
        st.markdown("""
        ### Troubleshooting Steps:
        1. **Check if MySQL is running:**
           ```bash
           sudo service mysql status
           # or
           mysql.server status
           ```
        
        2. **Start MySQL if not running:**
           ```bash
           sudo service mysql start
           # or
           mysql.server start
           ```
        
        3. **Check MySQL credentials:**
           - Default username: `root`
           - Default password: (empty or `root`)
        
        4. **Create database manually:**
           ```sql
           CREATE DATABASE options_analytics;
           ```
        
        5. **Update connection settings in code:**
           Modify the `create_connection()` function with your MySQL credentials.
        """)
        return False

def generate_salt():
    """Generate a random salt for password hashing"""
    return secrets.token_hex(16)

def hash_password(password, salt):
    """Hash password with salt using SHA-256"""
    return hashlib.sha256((password + salt).encode()).hexdigest()

def register_user(username, email, password, full_name="", company=""):
    """Register a new user"""
    conn = None
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor()
        
        # Check if username or email already exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                      (username, email))
        if cursor.fetchone():
            return False, "Username or email already exists"
        
        # Generate salt and hash password
        salt = generate_salt()
        password_hash = hash_password(password, salt)
        
        # Insert new user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, salt, full_name, company)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (username, email, password_hash, salt, full_name, company))
        
        user_id = cursor.lastrowid
        
        # Create default preferences
        cursor.execute("""
            INSERT INTO user_preferences (user_id)
            VALUES (%s)
        """, (user_id,))
        
        # Log activity
        cursor.execute("""
            INSERT INTO activity_log (user_id, activity_type, description)
            VALUES (%s, 'registration', 'New user registered')
        """, (user_id,))
        
        conn.commit()
        
        return True, "Registration successful"
        
    except Error as e:
        return False, f"Registration failed: {str(e)}"
    finally:
        if conn:
            conn.close()

def authenticate_user(username, password):
    """Authenticate user"""
    conn = None
    try:
        # Connect to database
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor(dictionary=True)
        
        # Get user data
        cursor.execute("""
            SELECT id, username, email, password_hash, salt, role, full_name, subscription_type
            FROM users 
            WHERE username = %s AND is_active = TRUE
        """, (username,))
        
        user = cursor.fetchone()
        
        if not user:
            return False, None, "Invalid username or password"
        
        # Verify password
        password_hash = hash_password(password, user['salt'])
        
        if password_hash != user['password_hash']:
            # Log failed attempt
            cursor.execute("""
                INSERT INTO activity_log (user_id, activity_type, description)
                VALUES (%s, 'failed_login', 'Failed login attempt')
            """, (user['id'],))
            conn.commit()
            
            return False, None, "Invalid username or password"
        
        # Update last login
        cursor.execute("""
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE id = %s
        """, (user['id'],))
        
        # Create session
        session_id = secrets.token_urlsafe(32)
        cursor.execute("""
            INSERT INTO user_sessions (session_id, user_id, ip_address, user_agent)
            VALUES (%s, %s, %s, %s)
        """, (session_id, user['id'], "127.0.0.1", "Streamlit App"))
        
        # Log successful login
        cursor.execute("""
            INSERT INTO activity_log (user_id, activity_type, description)
            VALUES (%s, 'login', 'User logged in successfully')
        """, (user['id'],))
        
        conn.commit()
        
        return True, {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'full_name': user['full_name'],
            'subscription_type': user['subscription_type'],
            'session_id': session_id
        }, "Login successful"
        
    except Error as e:
        return False, None, f"Authentication error: {str(e)}"
    finally:
        if conn:
            conn.close()

def validate_session(session_id):
    """Validate user session"""
    conn = None
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.role, u.full_name, u.subscription_type
            FROM users u
            JOIN user_sessions s ON u.id = s.user_id
            WHERE s.session_id = %s 
            AND u.is_active = TRUE
            AND s.last_activity > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        """, (session_id,))
        
        user = cursor.fetchone()
        
        if user:
            # Update last activity
            cursor.execute("""
                UPDATE user_sessions 
                SET last_activity = CURRENT_TIMESTAMP 
                WHERE session_id = %s
            """, (session_id,))
            conn.commit()
            
            return True, user
        
        return False, None
        
    except Error as e:
        return False, None
    finally:
        if conn:
            conn.close()

def logout_user(session_id):
    """Logout user and clear session"""
    conn = None
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor()
        
        # Get user_id from session for logging
        cursor.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session_id,))
        result = cursor.fetchone()
        
        if result:
            user_id = result[0]
            # Log logout activity
            cursor.execute("""
                INSERT INTO activity_log (user_id, activity_type, description)
                VALUES (%s, 'logout', 'User logged out')
            """, (user_id,))
        
        # Delete session
        cursor.execute("DELETE FROM user_sessions WHERE session_id = %s", (session_id,))
        
        conn.commit()
        
    except Error as e:
        pass
    finally:
        if conn:
            conn.close()

def get_user_preferences(user_id):
    """Get user preferences"""
    conn = None
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM user_preferences WHERE user_id = %s", (user_id,))
        preferences = cursor.fetchone()
        
        return preferences if preferences else {}
        
    except Error as e:
        return {}
    finally:
        if conn:
            conn.close()

def update_user_preferences(user_id, preferences):
    """Update user preferences"""
    conn = None
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='aditya18',
            database='options_analytics'
        )
        
        cursor = conn.cursor()
        
        # Check if preferences exist
        cursor.execute("SELECT id FROM user_preferences WHERE user_id = %s", (user_id,))
        if cursor.fetchone():
            # Update existing preferences
            cursor.execute("""
                UPDATE user_preferences 
                SET default_ticker = %s, 
                    default_option_type = %s,
                    default_expiry_days = %s,
                    default_history_years = %s,
                    theme = %s,
                    risk_tolerance = %s
                WHERE user_id = %s
            """, (
                preferences.get('default_ticker', 'AAPL'),
                preferences.get('default_option_type', 'Call'),
                preferences.get('default_expiry_days', 30),
                preferences.get('default_history_years', 5),
                preferences.get('theme', 'light'),
                preferences.get('risk_tolerance', 'medium'),
                user_id
            ))
        else:
            # Insert new preferences
            cursor.execute("""
                INSERT INTO user_preferences 
                (user_id, default_ticker, default_option_type, default_expiry_days, 
                 default_history_years, theme, risk_tolerance)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                preferences.get('default_ticker', 'AAPL'),
                preferences.get('default_option_type', 'Call'),
                preferences.get('default_expiry_days', 30),
                preferences.get('default_history_years', 5),
                preferences.get('theme', 'light'),
                preferences.get('risk_tolerance', 'medium')
            ))
        
        conn.commit()
        return True
        
    except Error as e:
        return False
    finally:
        if conn:
            conn.close()

# =============================
# SIMPLE LOGIN PAGE (FALLBACK)
# =============================

def show_simple_login():
    """Simple login page without database"""
    st.title("🔐 ApxForge Coo. Funds")
    st.markdown("### Login to access advanced options analytics")
    
    # Simple demo login without database
    with st.form("simple_login"):
        username = st.text_input("Username", value="demo")
        password = st.text_input("Password", type="password", value="demo123")
        
        submit = st.form_submit_button("Login", type="primary")
        
        if submit:
            if username == "demo" and password == "demo123":
                st.session_state.logged_in = True
                st.session_state.user = {
                    'username': 'demo',
                    'full_name': 'Demo User',
                    'role': 'admin',
                    'subscription_type': 'premium'
                }
                st.session_state.preferences = {
                    'default_ticker': 'AAPL',
                    'default_option_type': 'Call',
                    'default_expiry_days': 30,
                    'default_history_years': 5,
                    'theme': 'light',
                    'risk_tolerance': 'medium'
                }
                st.success("Logged in successfully!")
                time.sleep(1)
                st.rerun()
            else:
                st.error("Invalid credentials. Use demo/demo123")
    
    st.markdown("---")
    st.info("**Demo Credentials:** username=`demo`, password=`demo123`")

# =============================
# LOGIN PAGE WITH DATABASE
# =============================

def show_login_page():
    """Display login page with database"""
    st.title("🔐 ApxForge Coo. Funds")
    st.markdown("### Login to access advanced options analytics")
    
    tab1, tab2, tab3 = st.tabs(["Login", "Register", "Reset Password"])
    
    with tab1:
        with st.form("login_form"):
            username = st.text_input("Username")
            password = st.text_input("Password", type="password")
            remember_me = st.checkbox("Remember me")
            
            submit = st.form_submit_button("Login", type="primary")
            
            if submit:
                if not username or not password:
                    st.error("Please enter both username and password")
                else:
                    with st.spinner("Authenticating..."):
                        success, user_data, message = authenticate_user(username, password)
                        
                        if success:
                            st.session_state.logged_in = True
                            st.session_state.user = user_data
                            st.session_state.session_id = user_data['session_id']
                            st.success(message)
                            time.sleep(1)
                            st.rerun()
                        else:
                            st.error(message)
    
    with tab2:
        with st.form("register_form"):
            col1, col2 = st.columns(2)
            
            with col1:
                new_username = st.text_input("Choose Username*", help="Minimum 4 characters")
                full_name = st.text_input("Full Name")
                
            with col2:
                email = st.text_input("Email*")
                company = st.text_input("Company (Optional)")
            
            col3, col4 = st.columns(2)
            with col3:
                new_password = st.text_input("Password*", type="password", 
                                           help="Minimum 8 characters")
            with col4:
                confirm_password = st.text_input("Confirm Password*", type="password")
            
            terms = st.checkbox("I agree to the Terms & Conditions*")
            
            register = st.form_submit_button("Create Account", type="primary")
            
            if register:
                # Validate inputs
                if not all([new_username, email, new_password, confirm_password]):
                    st.error("Please fill all required fields (*)")
                elif len(new_username) < 4:
                    st.error("Username must be at least 4 characters")
                elif len(new_password) < 8:
                    st.error("Password must be at least 8 characters")
                elif new_password != confirm_password:
                    st.error("Passwords do not match")
                elif not terms:
                    st.error("You must agree to the Terms & Conditions")
                else:
                    with st.spinner("Creating account..."):
                        success, message = register_user(
                            new_username, email, new_password, full_name, company
                        )
                        
                        if success:
                            st.success(message)
                            # Auto-switch to login tab
                            st.info("Please login with your new credentials")
                        else:
                            st.error(message)
    
    with tab3:
        st.info("Password reset functionality coming soon")
        st.markdown("""
        For now, please contact support:
        - Email: support@optionsanalytics.com
        - Phone: +91 (555) 123-4568
        """)
    
    # Footer
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown("**Demo Credentials**")
        st.caption("Username: `demo`")
        st.caption("Password: `demo123`")
    with col2:
        st.markdown("**Need Help?**")
        st.caption("Contact: support@optionsanalytics.com")
    with col3:
        st.markdown("**Security**")
        st.caption("Bank-level encryption")
        st.caption("GDPR compliant")

# =============================
# MAIN APPLICATION FUNCTIONS (KEEPING YOUR ORIGINAL CODE)
# =============================

# ... [Keep all your original functions like put_price, calculate_all_greeks, etc.] ...

def put_price(S, K, T, r, sigma):
    """Calculate put option price using put-call parity"""
    call = call_price(S, K, T, r, sigma)
    return call + K * np.exp(-r * T) - S

def calculate_all_greeks(S, K, T, r, sigma, option_type="call"):
    """Calculate all Greeks for risk analysis"""
    from scipy.stats import norm
    
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    pdf_d1 = norm.pdf(d1)
    
    if option_type.lower() == "call":
        delta = norm.cdf(d1)
        gamma = pdf_d1 / (S * sigma * np.sqrt(T))
        vega = S * pdf_d1 * np.sqrt(T) / 100
        theta = (-S * pdf_d1 * sigma / (2 * np.sqrt(T)) 
                 - r * K * np.exp(-r * T) * norm.cdf(d2)) / 365
        rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100
    else:
        delta = norm.cdf(d1) - 1
        gamma = pdf_d1 / (S * sigma * np.sqrt(T))
        vega = S * pdf_d1 * np.sqrt(T) / 100
        theta = (-S * pdf_d1 * sigma / (2 * np.sqrt(T)) 
                 + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365
        rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100
    
    return {
        'delta': delta,
        'gamma': gamma,
        'theta': theta,
        'vega': vega,
        'rho': rho
    }

def calculate_ml_risk_score(S: float, K: float, T: float, vol: float, 
                           greeks: Dict, option_type: str, 
                           chain_data: pd.DataFrame = None) -> Tuple[float, Dict]:
    """Calculate ML-adjusted risk score (0-100)"""
    # ... [Keep your original function implementation] ...
    risk_factors = {}
    
    # 1. Moneyness risk
    moneyness = S / K if option_type.lower() == "call" else K / S
    if 0.9 <= moneyness <= 1.1:  # ATM
        moneyness_risk = 70
    elif moneyness > 1.1:  # ITM for calls
        moneyness_risk = 40 if option_type.lower() == "call" else 80
    else:  # OTM
        moneyness_risk = 80 if option_type.lower() == "call" else 40
    risk_factors['moneyness'] = moneyness_risk
    
    # 2. Time decay risk
    theta_risk = min(100, max(0, (abs(greeks.get('theta', 0)) * 365) * 100))
    risk_factors['time_decay'] = theta_risk
    
    # 3. Volatility risk
    if chain_data is not None and 'impliedVolatility' in chain_data.columns:
        chain_vol = chain_data['impliedVolatility'].median()
        vol_ratio = vol / chain_vol if chain_vol > 0 else 1
        vol_risk = min(100, max(0, (vol_ratio - 0.5) * 200))
    else:
        vol_risk = min(100, max(0, greeks.get('vega', 0) * 100))
    risk_factors['volatility'] = vol_risk
    
    # 4. Gamma risk
    gamma_risk = min(100, max(0, greeks.get('gamma', 0) * 10000))
    risk_factors['gamma'] = gamma_risk
    
    # 5. Liquidity risk
    if chain_data is not None and 'volume' in chain_data.columns:
        avg_volume = chain_data['volume'].median()
        liquidity_risk = 100 - min(100, (avg_volume / 1000) * 10)
    else:
        liquidity_risk = 50
    risk_factors['liquidity'] = liquidity_risk
    
    # 6. Delta exposure risk
    delta_exp = abs(greeks.get('delta', 0))
    delta_risk = min(100, delta_exp * 100)
    risk_factors['delta_exposure'] = delta_risk
    
    # Weighted average
    weights = {
        'moneyness': 0.25,
        'time_decay': 0.20,
        'volatility': 0.20,
        'gamma': 0.15,
        'liquidity': 0.10,
        'delta_exposure': 0.10
    }
    
    total_score = sum(risk_factors[factor] * weights[factor] for factor in risk_factors)
    return min(100, total_score), risk_factors

def create_risk_gauge(risk_score: float):
    """Create a simple risk gauge"""
    # ... [Keep your original function implementation] ...
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=risk_score,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': "Risk Score", 'font': {'size': 24}},
        delta={'reference': 50},
        gauge={
            'axis': {'range': [0, 100], 'tickwidth': 1},
            'bar': {'color': "darkblue"},
            'steps': [
                {'range': [0, 40], 'color': "green"},
                {'range': [40, 70], 'color': "yellow"},
                {'range': [70, 100], 'color': "red"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 70
            }
        }
    ))
    
    fig.update_layout(
        height=300,
        margin=dict(l=20, r=20, t=50, b=20)
    )
    return fig

def create_risk_breakdown(risk_factors: Dict):
    """Create risk factor breakdown chart"""
    # ... [Keep your original function implementation] ...
    factors = list(risk_factors.keys())
    values = [risk_factors[f] for f in factors]
    
    colors = ['red' if v > 70 else 'orange' if v > 40 else 'green' for v in values]
    
    fig = go.Figure(data=[
        go.Bar(
            x=factors,
            y=values,
            marker_color=colors,
            text=[f"{v:.1f}" for v in values],
            textposition='auto',
        )
    ])
    
    fig.update_layout(
        title="Risk Factor Breakdown",
        xaxis_title="Risk Factors",
        yaxis_title="Score (0-100)",
        height=400,
        showlegend=False
    )
    
    return fig

def show_contact_modal():
    """Display contact information modal"""
    # ... [Keep your original function implementation] ...
    with st.expander("📞 Contact Us", expanded=True):
        st.markdown("""
        ### Contact Information
        
        **🏢 Company Headquarters**  
        Options Analytics Inc.  
        JIIT Noida ,Sector 62 
        Noida, 
        INDIA  
        
        
        **📞 Phone Numbers**  
        - General Inquiries: +91 (555) 123-4567  
        - Technical Support: +91 (555) 123-4568  
        - Sales: +91 (555) 123-4569
        
        **📧 Email**  
        - General: info@optionsanalytics.com  
        - Support: support@optionsanalytics.com  
        - Sales: sales@optionsanalytics.com
        
        **🕒 Business Hours**  
        Monday - Friday: 9:00 AM - 6:00 PM EST  
        Saturday: 10:00 AM - 4:00 PM EST  
        Sunday: Closed
        
        **🌐 Website**  
        [www.optionsanalytics.com](https://www.optionsanalytics.com)
        
        **📱 Follow Us**  
        - LinkedIn: Options Analytics Inc.  
        - Twitter: @OptionsAnalytics  
        - YouTube: Options Analytics Channel
        """)
        
        # Contact form
        st.markdown("---")
        st.subheader("📝 Send us a message")
        
        with st.form("contact_form"):
            col1, col2 = st.columns(2)
            with col1:
                name = st.text_input("Your Name*", placeholder="John Smith")
            with col2:
                email = st.text_input("Your Email*", placeholder="john@example.com")
            
            department = st.selectbox(
                "Department",
                ["General Inquiry", "Technical Support", "Sales", "Feedback", "Partnership"]
            )
            
            message = st.text_area("Your Message*", 
                                 placeholder="Please describe your inquiry in detail...",
                                 height=150)
            
            urgency = st.select_slider(
                "Urgency Level",
                options=["Low", "Medium", "High", "Critical"]
            )
            
            submitted = st.form_submit_button("📤 Submit Message", type="primary")
            
            if submitted:
                if name and email and message:
                    st.success(f"✅ Thank you {name}! Your message has been submitted to {department}. We'll respond within 24 hours.")
                    
                    submission_data = {
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "name": name,
                        "email": email,
                        "department": department,
                        "urgency": urgency,
                        "message_preview": message[:100] + "..." if len(message) > 100 else message
                    }
                    
                    if 'contact_submissions' not in st.session_state:
                        st.session_state.contact_submissions = []
                    st.session_state.contact_submissions.append(submission_data)
                else:
                    st.error("⚠️ Please fill in all required fields (*)")

def show_help_center():
    """Display help and documentation"""
    # ... [Keep your original function implementation] ...
    with st.expander("❓ Help & Documentation", expanded=True):
        st.markdown("""
        ### 📚 Help Center
        
        **Quick Start Guides**
        1. **Getting Started**: Learn the basics of our platform
        2. **Pricing Models**: Understanding Black-Scholes vs ML-adjusted pricing
        3. **Risk Metrics**: How to interpret Delta, Theta, Vega, and Gamma
        4. **Volatility Analysis**: Working with historical and implied volatility
        
        **🔧 Troubleshooting**
        
        **Common Issues & Solutions:**
        
        **Q: Why are my option prices different from market prices?**  
        A: Our platform uses theoretical models. Market prices include additional factors like:
           - Liquidity premiums
           - Market sentiment
           - Supply and demand imbalances
           - Dividend expectations
        
        **Q: How accurate is the volatility surface?**  
        A: The volatility surface is approximated from available option chain data.
           For precise surfaces, consider using professional data providers.
        
        **Q: What does "ML-Adjusted" pricing mean?**  
        A: We train a machine learning model on simulated option data to adjust
           the theoretical Black-Scholes price based on additional market factors.
        
        **📖 Documentation Links**
        - [User Manual](https://docs.optionsanalytics.com)
        - [API Documentation](https://api.optionsanalytics.com/docs)
        - [Tutorial Videos](https://youtube.com/optionsanalytics)
        - [Research Papers](https://research.optionsanalytics.com)
        
        **🎓 Training & Certification**
        - Options Analytics Professional Certification
        - Advanced Risk Management Course
        - ML in Finance Workshop
        """)
        
        # FAQ Section
        st.markdown("---")
        st.subheader("❔ Frequently Asked Questions")
        
        faqs = {
            "How often is the data updated?": "Stock price data updates in real-time during market hours. Option chain data is updated every 15 minutes.",
            "What markets do you cover?": "We cover US equities (NYSE, NASDAQ), major indices (SPX, NDX), and ETF options.",
            "Can I export my analysis?": "Yes! Use the export buttons in each section to download data as CSV or PDF.",
            "Is there a mobile app?": "Our platform is fully responsive and works on all mobile browsers.",
            "Do you offer API access?": "Yes, we provide REST API access for enterprise clients. Contact sales for pricing.",
            "How secure is my data?": "We use bank-level encryption and comply with GDPR, SOC 2, and financial regulations."
        }
        
        for question, answer in faqs.items():
            with st.expander(f"**Q:** {question}"):
                st.write(f"**A:** {answer}")
        
        # Support ticket form
        st.markdown("---")
        st.subheader("🆘 Need more help?")
        
        issue_type = st.selectbox(
            "Issue Type",
            ["Technical Problem", "Feature Request", "Data Issue", "Billing", "Other"]
        )
        
        description = st.text_area("Describe your issue", height=100)
        
        if st.button("Create Support Ticket", type="secondary"):
            if description:
                ticket_id = f"TICKET-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
                st.success(f"✅ Support ticket #{ticket_id} created! Our team will contact you within 2 hours.")
            else:
                st.warning("Please describe your issue before submitting.")

def initialize_chat_state():
    """Initialize chat session state"""
    if 'chat_messages' not in st.session_state:
        st.session_state.chat_messages = []
    if 'gemini_api_key' not in st.session_state:
        st.session_state.gemini_api_key = ""
    if 'gemini_model' not in st.session_state:
        st.session_state.gemini_model = None

def setup_gemini_chat(api_key: str):
    """Configure Gemini API for chat"""
    try:
        genai.configure(api_key=api_key)
        
        # List available models
        models = genai.list_models()
        available_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        
        # Select model
        if 'models/gemini-1.5-pro' in available_models:
            model_name = 'models/gemini-1.5-pro'
        elif 'models/gemini-pro' in available_models:
            model_name = 'models/gemini-pro'
        else:
            model_name = available_models[0] if available_models else None
            
        if model_name:
            st.session_state.gemini_model = genai.GenerativeModel(model_name)
            return True, f"Connected using {model_name.split('/')[-1]}"
        else:
            return False, "No suitable Gemini model found"
            
    except Exception as e:
        return False, f"Error setting up Gemini: {str(e)}"

def generate_chat_response(prompt: str) -> str:
    """Generate chat response using Gemini"""
    try:
        if not st.session_state.gemini_model:
            return "Error: Model not initialized. Please check your API key."
        
        response = st.session_state.gemini_model.generate_content(prompt)
        
        if response.text:
            return response.text
        else:
            return "Sorry, I couldn't generate a response. Please try again."
            
    except Exception as e:
        return f"Error generating response: {str(e)}"

def show_user_preferences():
    """Display user preferences modal"""
    with st.sidebar.expander("👤 User Preferences", expanded=False):
        if 'user' in st.session_state:
            st.markdown(f"**Logged in as:** {st.session_state.user['username']}")
            st.markdown(f"**Role:** {st.session_state.user['role']}")
            st.markdown(f"**Subscription:** {st.session_state.user['subscription_type']}")
            
            st.markdown("---")
            
            # Load current preferences
            preferences = st.session_state.get('preferences', {})
            
            # Preferences form
            with st.form("preferences_form"):
                default_ticker = st.selectbox(
                    "Default Ticker",
                    TICKERS,
                    index=TICKERS.index(preferences.get('default_ticker', 'AAPL'))
                    if preferences.get('default_ticker') in TICKERS else 0
                )
                
                default_option_type = st.radio(
                    "Default Option Type",
                    ["Call", "Put"],
                    index=0 if preferences.get('default_option_type', 'Call') == 'Call' else 1
                )
                
                default_expiry_days = st.slider(
                    "Default Expiry Days",
                    7, 365,
                    preferences.get('default_expiry_days', 30)
                )
                
                default_history_years = st.slider(
                    "Default History Years",
                    1, 10,
                    preferences.get('default_history_years', 5)
                )
                
                risk_tolerance = st.select_slider(
                    "Risk Tolerance",
                    options=["low", "medium", "high"],
                    value=preferences.get('risk_tolerance', 'medium')
                )
                
                theme = st.radio(
                    "Theme",
                    ["light", "dark"],
                    index=0 if preferences.get('theme', 'light') == 'light' else 1
                )
                
                if st.form_submit_button("Save Preferences"):
                    new_preferences = {
                        'default_ticker': default_ticker,
                        'default_option_type': default_option_type,
                        'default_expiry_days': default_expiry_days,
                        'default_history_years': default_history_years,
                        'risk_tolerance': risk_tolerance,
                        'theme': theme
                    }
                    
                    st.session_state.preferences = new_preferences
                    st.success("Preferences saved!")
            
            # Logout button
            if st.button("🚪 Logout", use_container_width=True):
                if 'session_id' in st.session_state:
                    logout_user(st.session_state.session_id)
                st.session_state.clear()
                st.rerun()

# =============================
# MAIN APPLICATION
# =============================

def main_application():
    """Main application after login"""
    # =============================
    # PAGE CONFIG
    # =============================
    st.set_page_config(
        page_title="ApxForge Coo. Funds",
        page_icon="📊",
        layout="wide"
    )

    st.title("📊 ApxForge Coo. Funds Analytics & Risk Platform")
    st.caption(f"Welcome, {st.session_state.user.get('full_name', st.session_state.user['username'])}!")
    
    # Add logout button to top right
    col1, col2, col3 = st.columns([6, 1, 1])
    with col3:
        if st.button("🚪 Logout", key="top_logout"):
            if 'session_id' in st.session_state:
                logout_user(st.session_state.session_id)
            st.session_state.clear()
            st.rerun()

    # =============================
    # SIDEBAR - UPDATED WITH USER PREFERENCES
    # =============================
    st.sidebar.header("🔧 Analytics Controls")
    
    # Use preferences if available
    preferences = st.session_state.get('preferences', {})
    default_ticker = preferences.get('default_ticker', 'AAPL')
    default_option_type = preferences.get('default_option_type', 'Call')
    default_expiry_days = preferences.get('default_expiry_days', 30)
    default_history_years = preferences.get('default_history_years', 5)
    
    ticker = st.sidebar.selectbox("Stock", TICKERS, index=TICKERS.index(default_ticker) if default_ticker in TICKERS else 0)
    
    option_type = st.sidebar.radio("Option Type", ["Call", "Put"], 
                                   index=0 if default_option_type == 'Call' else 1)
    
    expiry_days = st.sidebar.slider("Time to Expiry (days)", 7, 365, default_expiry_days)
    
    history_years = st.sidebar.slider("Stock History (years)", 1, 10, default_history_years)
    
    pricing_mode = st.sidebar.radio(
        "Pricing Mode",
        ["Black–Scholes", "ML-Adjusted"]
    )
    
    vol_scenario = st.sidebar.selectbox(
        "Volatility Scenario",
        ["Current", "Low (-20%)", "High (+20%)"]
    )
    
    use_real_chain = st.sidebar.checkbox("Use Real Yahoo Option Chain")
    show_surface = st.sidebar.checkbox("Show Volatility Surface")
    
    # RISK METER CONTROLS
    st.sidebar.markdown("---")
    st.sidebar.header("⚠️ Risk Meter Settings")
    enable_risk_meter = st.sidebar.checkbox("Enable Risk Meter", value=True)
    
    if enable_risk_meter:
        risk_sensitivity = st.sidebar.slider(
            "Risk Sensitivity",
            min_value=0.5,
            max_value=2.0,
            value=1.0,
            step=0.1,
            help="Adjust risk scoring sensitivity"
        )
        
        include_chain_data = st.sidebar.checkbox(
            "Use Chain Data in Risk", 
            value=True,
            help="Use live option chain data for risk calculation"
        )
    
    # =============================
    # SIDEBAR - COMPANY & USER SECTION
    # =============================
    st.sidebar.markdown("---")
    st.sidebar.header("🏢 Company")
    
    # Show user preferences
    show_user_preferences()
    
    # Contact Us Button
    if st.sidebar.button("📞 Contact Us", 
                         use_container_width=True,
                         help="Get in touch with our team"):
        show_contact_modal()
    
    # Help Button
    if st.sidebar.button("❓ Help Center", 
                         use_container_width=True,
                         help="Get help and documentation"):
        show_help_center()
    
    # Additional company buttons
    col1, col2 = st.sidebar.columns(2)
    with col1:
        if st.button("📚 Docs", 
                     help="View documentation",
                     use_container_width=True):
            st.info("Opening documentation...")
            
    with col2:
        if st.button("💼 About", 
                     help="Learn about our company",
                     use_container_width=True):
            st.info("""
            **About Options Analytics Inc.**
            
            We provide cutting-edge options analytics tools for:
            - Quantitative Analysts
            - Risk Managers
            - Hedge Funds
            - Institutional Investors
            
            Founded in 2026.
            """)
    
    # Company info footer
    st.sidebar.markdown("---")
    st.sidebar.markdown("""
    <div style='text-align: center; color: #666; font-size: 0.8em;'>
    <p><strong>Options Analytics Inc.</strong></p>
    <p>Version 3.2.1 • © 2024</p>
    <p>All rights reserved</p>
    </div>
    """, unsafe_allow_html=True)
    
    # =============================
    # LOAD STOCK DATA
    # =============================
    with st.spinner("Loading stock data..."):
        data = load_stock_data(ticker, period=f"{history_years}y")
    
    S = data["Close"].iloc[-1]
    hist_vol = historical_volatility(data["returns"])
    
    if vol_scenario == "Low (-20%)":
        vol = hist_vol * 0.8
    elif vol_scenario == "High (+20%)":
        vol = hist_vol * 1.2
    else:
        vol = hist_vol
    
    K = round(S)
    T = expiry_days / 365
    
    # =============================
    # OPTION PRICING
    # =============================
    if option_type == "Call":
        bs_price = call_price(S, K, T, RISK_FREE_RATE, vol)
    else:
        bs_price = put_price(S, K, T, RISK_FREE_RATE, vol)
    
    delta, theta, vega = calculate_greeks(S, K, T, RISK_FREE_RATE, vol)
    hedge = delta_hedge(delta)
    
    # =============================
    # ML PRICE (OPTIONAL)
    # =============================
    ml_price = None
    mae = None
    
    if pricing_mode == "ML-Adjusted":
        with st.spinner("Training global ML adjustment..."):
            df = generate_option_samples(S, K, RISK_FREE_RATE, hist_vol, n=1500)
            model, scaler, mae = train_model(df)
            features = scaler.transform([[S, K, T, vol, delta, theta, vega]])
            ml_price = model.predict(features)[0]
    
    final_price = ml_price if ml_price else bs_price
    
    # =============================
    # RISK METER CALCULATIONS
    # =============================
    if enable_risk_meter:
        with st.spinner("Calculating risk metrics..."):
            # Load chain data if needed
            chain_data = None
            if include_chain_data and use_real_chain:
                try:
                    chain_data = load_option_chain(ticker)
                except:
                    st.warning("Could not load chain data for risk calculation")
            
            # Calculate all Greeks for risk analysis
            greeks = calculate_all_greeks(S, K, T, RISK_FREE_RATE, vol, option_type)
            greeks['delta'] = delta
            greeks['theta'] = theta
            greeks['vega'] = vega
            
            # Calculate risk score
            risk_score, risk_factors = calculate_ml_risk_score(
                S, K, T, vol, greeks, option_type, chain_data
            )
            
            # Apply sensitivity
            adjusted_score = min(100, risk_score * risk_sensitivity)
            for factor in risk_factors:
                risk_factors[factor] = min(100, risk_factors[factor] * risk_sensitivity)
    
    # =============================
    # LAYOUT TABS - ADD RISK TAB
    # =============================
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs(
        ["📈 Pricing & Risk", "📉 Payoff", "🧠 Volatility", 
         "📊 Market Data", "🤖 AI Chat", "⚠️ Risk Meter"]
    )
    
    # =============================
    # TAB 1 — PRICING & RISK (UPDATED WITH RISK METER)
    # =============================
    with tab1:
        st.subheader(f"{ticker} — {option_type} Option")
        
        # Display risk score at the top if enabled
        if enable_risk_meter:
            col_risk1, col_risk2, col_risk3 = st.columns([1, 2, 1])
            with col_risk2:
                risk_color = "red" if adjusted_score > 70 else "orange" if adjusted_score > 40 else "green"
                risk_text = "HIGH" if adjusted_score > 70 else "MEDIUM" if adjusted_score > 40 else "LOW"
                
                st.markdown(f"""
                <div style="border:3px solid {risk_color}; padding:15px; border-radius:15px; text-align:center; background-color: rgba(255,255,255,0.1);">
                    <h3 style="color:{risk_color}; margin:0;">⚡ RISK METER: {risk_text}</h3>
                    <h1 style="color:{risk_color}; margin:5px 0;">{adjusted_score:.0f}/100</h1>
                    <p style="margin:0; color:#666;">ML-adjusted with live chain data</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Risk level indicator
                st.progress(adjusted_score/100, text=f"Risk Level: {adjusted_score:.0f}%")
    
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Spot Price", f"${S:.2f}")
        col2.metric("Strike", f"${K}")
        col3.metric("Volatility", f"{vol:.2%}")
        col4.metric("Expiry", f"{expiry_days} days")
    
        st.divider()
    
        col5, col6, col7, col8 = st.columns(4)
        col5.metric("Final Price", f"${final_price:.2f}")
        col6.metric("Delta", f"{delta:.3f}")
        col7.metric("Theta", f"{theta:.2f}")
        col8.metric("Vega", f"{vega:.2f}")
    
        st.info(
            f"**Delta Hedge:** Short **{abs(hedge):.2f} shares** per option to remain delta-neutral."
        )
    
        if mae:
            st.caption(f"ML Model MAE (training): {mae:.4f}")
    
    # =============================
    # TAB 2 — PAYOFF
    # =============================
    with tab2:
        st.subheader("Option Payoff at Expiry")
    
        price_range = np.linspace(S * 0.7, S * 1.3, 100)
    
        if option_type == "Call":
            payoff = np.maximum(price_range - K, 0) - final_price
        else:
            payoff = np.maximum(K - price_range, 0) - final_price
    
        fig, ax = plt.subplots()
        ax.plot(price_range, payoff, label="Payoff")
        ax.axhline(0, linestyle="--")
        ax.set_xlabel("Stock Price at Expiry")
        ax.set_ylabel("Profit / Loss")
        ax.legend()
        st.pyplot(fig)
    
    # =============================
    # TAB 3 — VOLATILITY
    # =============================
    with tab3:
        st.subheader("Volatility Analysis")
    
        st.write(f"Historical Volatility: **{hist_vol:.2%}**")
        st.write(f"Scenario Volatility: **{vol:.2%}**")
    
        if use_real_chain:
            with st.spinner("Loading option chain..."):
                chain = load_option_chain(ticker)
    
            st.success("Real Yahoo option chain loaded")
    
            if show_surface:
                surface = approximate_vol_surface(chain)
                st.write("Approximate Volatility Surface (Smile by Expiry)")
                st.dataframe(surface)
    
    # =============================
    # TAB 4 — MARKET DATA
    # =============================
    with tab4:
        st.subheader(f"{ticker} Stock Price History ({history_years} years)")
        st.line_chart(data["Close"])
    
        if use_real_chain:
            st.subheader("Live Option Chain Snapshot")
            st.dataframe(chain.head(20))
    
    # =============================
    # TAB 5 — AI CHAT
    # =============================
    with tab5:
        st.subheader("🤖 AI Chat Assistant")
        st.markdown("Ask questions about options trading, risk management, or market analysis")
        
        # Initialize chat state
        initialize_chat_state()
        
        # Chat configuration in tab
        with st.expander("🔧 Chat Settings", expanded=False):
            api_key = st.text_input(
                "Gemini API Key:",
                type="password",
                value=st.session_state.get('gemini_api_key', ''),
                help="Get free API key from: https://aistudio.google.com/app/apikey"
            )
            
            if api_key and api_key != st.session_state.gemini_api_key:
                st.session_state.gemini_api_key = api_key
                success, message = setup_gemini_chat(api_key)
                if success:
                    st.success(message)
                else:
                    st.error(message)
            
            col_btn1, col_btn2 = st.columns(2)
            with col_btn1:
                if st.button("Clear Chat"):
                    st.session_state.chat_messages = []
                    st.rerun()
            
            with col_btn2:
                if st.button("Example Questions"):
                    example_questions = [
                        "What is delta hedging?",
                        "Explain the Black-Scholes model",
                        "What is implied volatility?",
                        "How do options Greeks work?",
                        "What are the risks in options trading?"
                    ]
                    st.session_state.chat_messages.append({
                        "role": "assistant", 
                        "content": "Here are some example questions you can ask:\n\n" + "\n".join([f"• {q}" for q in example_questions])
                    })
                    st.rerun()
        
        # Chat display
        chat_container = st.container()
        
        with chat_container:
            for message in st.session_state.chat_messages:
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])
        
        # Chat input
        if prompt := st.chat_input("Ask about options, trading, or risk..."):
            # Check API key
            if not st.session_state.gemini_api_key or not st.session_state.gemini_model:
                st.error("Please enter your Gemini API key in the Chat Settings first!")
                st.stop()
            
            # Add user message
            st.session_state.chat_messages.append({"role": "user", "content": prompt})
            
            # Display user message
            with st.chat_message("user"):
                st.markdown(prompt)
            
            # Generate and display response
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = generate_chat_response(prompt)
                    st.markdown(response)
            
            # Add assistant response
            st.session_state.chat_messages.append({"role": "assistant", "content": response})
    
    # =============================
    # TAB 6 — RISK METER (NEW TAB)
    # =============================
    with tab6:
        if not enable_risk_meter:
            st.warning("⚠️ Enable Risk Meter in sidebar settings to view risk analysis")
            if st.button("Enable Risk Meter Now"):
                st.session_state.enable_risk_meter = True
                st.rerun()
        else:
            st.header("⚠️ ML-Adjusted Risk Meter")
            st.markdown(f"**{ticker} {option_type} Option** | Strike: ${K} | Expiry: {expiry_days} days")
            
            # Main risk display
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.subheader("Overall Risk Assessment")
                
                # Risk gauge
                fig_gauge = create_risk_gauge(adjusted_score)
                st.plotly_chart(fig_gauge, use_container_width=True)
                
                # Risk interpretation
                st.markdown("### 📊 Risk Interpretation")
                
                if adjusted_score >= 70:
                    st.error("""
                    **🚨 HIGH RISK ALERT**
                    - Position carries significant risk
                    - Consider reducing position size
                    - Implement protective hedges
                    - Set tight stop-losses
                    """)
                elif adjusted_score >= 40:
                    st.warning("""
                    **⚠️ MODERATE RISK**
                    - Manageable with active monitoring
                    - Monitor volatility changes
                    - Consider delta hedging
                    - Review position sizing
                    """)
                else:
                    st.success("""
                    **✅ LOW RISK**
                    - Conservative position
                    - Suitable for risk-averse investors
                    - Monitor for major market shifts
                    - Consider leverage for enhanced returns
                    """)
            
            with col2:
                st.subheader("Key Metrics")
                
                # Display risk factors
                for factor, score in risk_factors.items():
                    factor_name = factor.replace('_', ' ').title()
                    color = "red" if score > 70 else "orange" if score > 40 else "green"
                    
                    st.metric(
                        label=factor_name,
                        value=f"{score:.1f}",
                        delta="High" if score > 70 else "Medium" if score > 40 else "Low"
                    )
                
                # Additional metrics
                st.markdown("---")
                st.metric("Volatility", f"{vol:.2%}")
                st.metric("Moneyness", f"{(S/K if option_type == 'Call' else K/S):.3f}")
                st.metric("Time Decay/Day", f"${abs(theta):.4f}")
            
            # Risk breakdown chart
            st.subheader("Risk Factor Breakdown")
            fig_breakdown = create_risk_breakdown(risk_factors)
            st.plotly_chart(fig_breakdown, use_container_width=True)
            
            # Detailed analysis
            with st.expander("📈 Detailed Risk Analysis", expanded=False):
                col_a, col_b, col_c = st.columns(3)
                
                with col_a:
                    st.markdown("**Moneyness Risk**")
                    moneyness = S / K if option_type == "Call" else K / S
                    st.write(f"Ratio: {moneyness:.3f}")
                    st.write("ATM options have highest risk due to gamma exposure")
                
                with col_b:
                    st.markdown("**Time Decay Risk**")
                    st.write(f"Theta: ${theta:.4f}/day")
                    st.write("Higher theta = faster time decay = higher risk")
                
                with col_c:
                    st.markdown("**Volatility Risk**")
                    st.write(f"Vega: ${vega:.2f}/1% vol")
                    st.write("Higher vega = more sensitive to volatility changes")
            
            # Stress testing
            with st.expander("🧪 Stress Testing", expanded=False):
                st.write("Simulate different market scenarios:")
                
                scenarios = {
                    "Market Crash (-20%)": {"S_mult": 0.8, "vol_mult": 1.3},
                    "Volatility Spike (+50%)": {"S_mult": 1.0, "vol_mult": 1.5},
                    "Time Decay (7 days)": {"T_days": 7},
                    "Combined Stress": {"S_mult": 0.8, "vol_mult": 1.5, "T_days": 7}
                }
                
                for scenario_name, params in scenarios.items():
                    # Calculate stress Greeks
                    S_stress = S * params.get('S_mult', 1.0)
                    vol_stress = vol * params.get('vol_mult', 1.0)
                    T_stress = params.get('T_days', expiry_days) / 365
                    
                    stress_greeks = calculate_all_greeks(
                        S_stress, K, T_stress, RISK_FREE_RATE, vol_stress, option_type
                    )
                    
                    # Calculate stress risk
                    stress_score, _ = calculate_ml_risk_score(
                        S_stress, K, T_stress, vol_stress, stress_greeks, option_type, chain_data
                    )
                    
                    col_scen1, col_scen2, col_scen3 = st.columns([2, 1, 1])
                    with col_scen1:
                        st.write(f"**{scenario_name}**")
                    with col_scen2:
                        st.write(f"Score: {stress_score:.1f}")
                    with col_scen3:
                        delta_score = stress_score - adjusted_score
                        st.write(f"Δ: {delta_score:+.1f}")
            
            # Export functionality
            st.markdown("---")
            col_export1, col_export2, col_export3 = st.columns(3)
            
            with col_export1:
                if st.button("📊 Export Risk Report"):
                    report_data = {
                        "timestamp": datetime.now().isoformat(),
                        "ticker": ticker,
                        "option_type": option_type,
                        "strike": K,
                        "spot_price": S,
                        "volatility": vol,
                        "expiry_days": expiry_days,
                        "overall_risk_score": adjusted_score,
                        **{f"risk_{k}": v for k, v in risk_factors.items()}
                    }
                    
                    df_report = pd.DataFrame([report_data])
                    csv = df_report.to_csv(index=False)
                    
                    st.download_button(
                        label="Download CSV",
                        data=csv,
                        file_name=f"risk_report_{ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        mime="text/csv"
                    )
            
            with col_export2:
                if st.button("🔄 Refresh Analysis"):
                    st.rerun()
            
            with col_export3:
                if st.button("📋 Copy Summary"):
                    summary = f"""
                    {ticker} {option_type} Risk Analysis
                    Strike: ${K} | Spot: ${S:.2f}
                    Risk Score: {adjusted_score:.1f}/100
                    Moneyness: {risk_factors['moneyness']:.1f}
                    Time Decay: {risk_factors['time_decay']:.1f}
                    Volatility: {risk_factors['volatility']:.1f}
                    """
                    st.code(summary, language="text")

# =============================
# APP ENTRY POINT
# =============================

def main():
    """Main entry point for the application"""
    # Initialize session state
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False
        st.session_state.use_database = False  # Track if database is available
    
    # Check if we should try database or use simple login
    if 'try_database' not in st.session_state:
        st.session_state.try_database = True
    
    # Try to initialize database
    if st.session_state.try_database and not st.session_state.logged_in:
        with st.spinner("Initializing database..."):
            try:
                if init_database():
                    st.session_state.use_database = True
                    st.session_state.try_database = False
                else:
                    st.session_state.use_database = False
                    st.session_state.try_database = False
            except Exception as e:
                st.session_state.use_database = False
                st.session_state.try_database = False
    
    # Show appropriate page based on login status
    if st.session_state.logged_in:
        main_application()
    else:
        # Show database login or simple login based on availability
        if st.session_state.use_database:
            show_login_page()
        else:
            # Show warning about database and option to try again
            st.warning("⚠️ Database connection failed. Using demo mode.")
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("🔧 Try Database Again"):
                    st.session_state.try_database = True
                    st.rerun()
            
            with col2:
                if st.button("➡️ Continue in Demo Mode"):
                    st.session_state.try_database = False
                    st.rerun()
            
            show_simple_login()

if __name__ == "__main__":
    main()