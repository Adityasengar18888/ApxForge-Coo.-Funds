# Architectural Decisions Log (ADR)

This document formalizes the fundamental design and engineering decisions made during the complete reconstruction of ApxForge Funds.

---

## ADR 1: Replacement of Streamlit with Next.js 14 (App Router) + FastAPI

- **Context**: The legacy application was built as a single Streamlit script. While rapid to prototype, Streamlit executes the entire script from top to bottom on every user input change, making interactive 3D visualizations, background scheduled tasks, JWT authentication, and high-frequency parameter exploration impossible without severe UI freezing and yfinance rate-limiting.
- **Decision**: Decouple the frontend and backend completely. Build the frontend using Next.js 14 with TypeScript strict mode, React Server Components where applicable, and TanStack Query client caching. Build the backend using FastAPI with asynchronous ASGI execution and Pydantic v2 validation.
- **Consequences**: Millisecond-level UI responsiveness, persistent background daemons, zero UI freezing, and enterprise security posture.

---

## ADR 2: SQLModel for Object-Relational Mapping (ORM)

- **Context**: We required a persistence layer compatible with SQLite for local zero-config execution while remaining 100% cloud-ready for PostgreSQL in production.
- **Decision**: Use `SQLModel`, combining Pydantic v2 schemas and SQLAlchemy Core into unified declarative classes.
- **Consequences**: Elimination of duplicate schema definitions between API contracts and database entities.

---

## ADR 3: 2D & 3D Visualization Engines (Apache ECharts & Three.js)

- **Context**: Quantitative analytics require both standard financial charts (candlesticks, RSI, waterfalls) and multidimensional manifolds (volatility surfaces, PCA 3D scatter, Monte Carlo cone simulations).
- **Decision**:
  - 2D charts: Apache ECharts via `echarts-for-react` (high performance canvas rendering capable of handling 100k+ data points, built-in zoom/pan, SVG export, and dark mode theming).
  - 3D charts: Three.js with `@react-three/fiber` and `@react-three/drei` (lazy loaded with custom orbit controls, dynamic mesh deformation, and metallic shaders).
- **Consequences**: Interactive 60fps WebGL rendering across all desktop and mobile browsers.

---

## ADR 4: Apple Human Interface Guidelines (HIG) Design Language

- **Context**: Institutional finance software frequently suffers from cluttered, dense, and unrefined interfaces.
- **Decision**: Adopt the complete Apple iOS Human Interface Guidelines:
  - System font stack (`-apple-system`, `SF Pro Display`, `SF Pro Text`).
  - Strict typography scale (34px bold large title, 17px body, 13px secondary, 11px uppercase section headers).
  - Semantic color palette (System Blue `#007AFF`, System Green `#34C759`, System Red `#FF3B30`).
  - Tactile spring physics (stiffness 300, damping 30) with scale 0.97 active press states.
  - Translucent frosted glass headers via `backdrop-filter: saturate(180%) blur(20px)`.
- **Consequences**: Distinctive, clean, institutional-grade user experience that feels native on both desktop and mobile devices.

---

## ADR 5: JWT Authentication, Refresh Rotation & Security Hardening

- **Context**: The legacy codebase possessed no access controls or audit logs.
- **Decision**: Implement dual-token JWT authentication (short-lived access token, long-lived refresh token in httpOnly cookie), password hashing with bcrypt, IP-based sliding window rate limiting (5 requests/minute), account lockout after 10 failures, forced password change enforcement on default accounts, and an immutable `AuditLog` table.
- **Consequences**: Enterprise-grade security compliance with complete session auditability.

