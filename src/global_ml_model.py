from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error

def train_global_model(df):
    X = df.drop("MarketPrice", axis=1)
    y = df["MarketPrice"]

    categorical = ["Ticker"]
    numerical = [c for c in X.columns if c != "Ticker"]

    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
        ("num", "passthrough", numerical)
    ])

    model = GradientBoostingRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=4
    )

    pipeline = Pipeline([
        ("prep", preprocessor),
        ("model", model)
    ])

    pipeline.fit(X, y)

    preds = pipeline.predict(X)
    mae = mean_absolute_error(y, preds)

    return pipeline, mae
