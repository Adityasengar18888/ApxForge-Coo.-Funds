import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from scipy import stats
from statsmodels.stats.multicomp import pairwise_tukeyhsd
from statsmodels.stats.multitest import multipletests
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error

def run_hypothesis_tests(
    sample_a: List[float],
    sample_b: Optional[List[float]] = None,
    pop_mean: float = 0.0,
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    Executes one-sample, two-sample (Student & Welch), paired t-tests, Z-test, and F-test.
    Returns test statistics, p-values, Cohen's d effect sizes, and verbal interpretations.
    """
    arr_a = np.array(sample_a, dtype=float)
    n_a = len(arr_a)
    mean_a = float(np.mean(arr_a))
    std_a = float(np.std(arr_a, ddof=1)) if n_a > 1 else 0.0

    # 1. One-sample t-test against pop_mean
    t_stat_1, p_val_1 = stats.ttest_1samp(arr_a, pop_mean)
    d_1 = (mean_a - pop_mean) / (std_a + 1e-9)

    # 95% Confidence Interval for Sample A
    ci_a = stats.t.interval(1.0 - alpha, df=max(1, n_a - 1), loc=mean_a, scale=std_a / np.sqrt(max(1, n_a)))

    results: Dict[str, Any] = {
        "alpha": alpha,
        "sample_a_stats": {
            "n": n_a,
            "mean": round(mean_a, 4),
            "std": round(std_a, 4),
            "ci_lower": round(float(ci_a[0]), 4),
            "ci_upper": round(float(ci_a[1]), 4),
        },
        "one_sample_t_test": {
            "test_stat": round(float(t_stat_1), 4),
            "p_value": round(float(p_val_1), 6),
            "effect_size_cohens_d": round(float(d_1), 4),
            "is_significant": bool(p_val_1 < alpha),
            "interpretation": (
                f"Statistically significant difference from {pop_mean} (p < {alpha})."
                if p_val_1 < alpha
                else f"No statistically significant difference from {pop_mean} (p >= {alpha})."
            )
        }
    }

    if sample_b and len(sample_b) > 1:
        arr_b = np.array(sample_b, dtype=float)
        n_b = len(arr_b)
        mean_b = float(np.mean(arr_b))
        std_b = float(np.std(arr_b, ddof=1))

        # Two-sample Student's t-test (equal variance assumed)
        t_stat_2, p_val_2 = stats.ttest_ind(arr_a, arr_b, equal_var=True)
        # Welch's t-test (unequal variance)
        t_stat_welch, p_val_welch = stats.ttest_ind(arr_a, arr_b, equal_var=False)

        # Pooled Cohen's d
        pooled_std = np.sqrt(((n_a - 1) * std_a**2 + (n_b - 1) * std_b**2) / max(1, (n_a + n_b - 2)))
        d_2 = (mean_a - mean_b) / (pooled_std + 1e-9)

        # F-test for equality of variances
        var_a = np.var(arr_a, ddof=1)
        var_b = np.var(arr_b, ddof=1)
        f_stat = var_a / (var_b + 1e-9)
        f_pvalue = stats.f.cdf(f_stat, n_a - 1, n_b - 1)
        f_pvalue = 2.0 * min(f_pvalue, 1.0 - f_pvalue)

        # Difference of means CI
        diff_mean = mean_a - mean_b
        diff_se = np.sqrt(std_a**2 / n_a + std_b**2 / n_b)
        diff_ci = stats.t.interval(1.0 - alpha, df=min(n_a, n_b) - 1, loc=diff_mean, scale=diff_se)

        results["sample_b_stats"] = {
            "n": n_b,
            "mean": round(mean_b, 4),
            "std": round(std_b, 4)
        }
        results["two_sample_t_test"] = {
            "test_stat": round(float(t_stat_2), 4),
            "p_value": round(float(p_val_2), 6),
            "effect_size_cohens_d": round(float(d_2), 4),
            "is_significant": bool(p_val_2 < alpha),
            "interpretation": (
                f"Significant mean difference between samples (p < {alpha}, d={round(float(d_2), 2)})."
                if p_val_2 < alpha
                else "No significant difference between sample means."
            )
        }
        results["welch_t_test"] = {
            "test_stat": round(float(t_stat_welch), 4),
            "p_value": round(float(p_val_welch), 6),
            "is_significant": bool(p_val_welch < alpha),
            "interpretation": "Robust to unequal variances."
        }
        results["f_test_variance"] = {
            "test_stat": round(float(f_stat), 4),
            "p_value": round(float(f_pvalue), 6),
            "is_significant": bool(f_pvalue < alpha),
            "interpretation": "Unequal variances detected" if f_pvalue < alpha else "Variances are homogeneous"
        }
        results["difference_of_means"] = {
            "difference": round(float(diff_mean), 4),
            "ci_lower": round(float(diff_ci[0]), 4),
            "ci_upper": round(float(diff_ci[1]), 4)
        }

    return results

def run_one_way_anova(groups: Dict[str, List[float]], alpha: float = 0.05) -> Dict[str, Any]:
    """
    One-way ANOVA and Tukey HSD post-hoc test across multiple asset groups.
    """
    group_names = list(groups.keys())
    data_lists = [np.array(groups[g], dtype=float) for g in group_names]

    f_stat, p_val = stats.f_oneway(*data_lists)

    # Calculate eta-squared effect size (SS_between / SS_total)
    all_data = np.concatenate(data_lists)
    grand_mean = np.mean(all_data)
    ss_total = np.sum((all_data - grand_mean)**2)
    ss_between = sum(len(g) * (np.mean(g) - grand_mean)**2 for g in data_lists)
    eta_squared = float(ss_between / (ss_total + 1e-9))

    # Tukey HSD post-hoc
    flat_data, flat_labels = [], []
    for g in group_names:
        for val in groups[g]:
            flat_data.append(val)
            flat_labels.append(g)

    tukey_res = pairwise_tukeyhsd(flat_data, flat_labels, alpha=alpha)
    tukey_table = []
    for row in tukey_res.summary().data[1:]:
        tukey_table.append({
            "group1": str(row[0]),
            "group2": str(row[1]),
            "meandiff": round(float(row[2]), 4),
            "p_adj": round(float(row[3]), 4),
            "lower": round(float(row[4]), 4),
            "upper": round(float(row[5]), 4),
            "reject": bool(row[6])
        })

    return {
        "f_statistic": round(float(f_stat), 4),
        "p_value": round(float(p_val), 6),
        "eta_squared": round(eta_squared, 4),
        "is_significant": bool(p_val < alpha),
        "interpretation": (
            f"Statistically significant group variance (F={round(float(f_stat), 2)}, p < {alpha}, η²={round(eta_squared, 2)})."
            if p_val < alpha
            else "No statistically significant differences among group means."
        ),
        "tukey_posthoc": tukey_table
    }

def run_chi_square_test(contingency_matrix: List[List[int]]) -> Dict[str, Any]:
    """Chi-square test of independence for categorical distributions."""
    obs = np.array(contingency_matrix)
    chi2_stat, p_val, dof, expected = stats.chi2_contingency(obs)
    # Cramer's V
    n = np.sum(obs)
    min_dim = min(obs.shape) - 1
    cramers_v = np.sqrt(chi2_stat / (n * max(1, min_dim)))

    return {
        "chi2_statistic": round(float(chi2_stat), 4),
        "p_value": round(float(p_val), 6),
        "degrees_of_freedom": int(dof),
        "cramers_v": round(float(cramers_v), 4),
        "is_significant": bool(p_val < 0.05),
        "interpretation": "Statistically significant association between variables." if p_val < 0.05 else "Independent categories."
    }

def correct_multiple_comparisons(p_values: List[float], method: str = "fdr_bh") -> List[Dict[str, Any]]:
    """
    Multiple-comparison corrections:
    - bonferroni
    - fdr_bh (Benjamini-Hochberg)
    """
    reject, pvals_corrected, _, _ = multipletests(p_values, alpha=0.05, method=method)
    return [
        {
            "original_p": round(float(p), 6),
            "corrected_p": round(float(adj_p), 6),
            "significant": bool(rej)
        }
        for p, adj_p, rej in zip(p_values, pvals_corrected, reject)
    ]

def simulate_bias_variance_sweep(degrees: List[int] = list(range(1, 11))) -> List[Dict[str, Any]]:
    """
    Polynomial degree sweep simulation visualizing Bias-Variance Tradeoff.
    """
    np.random.seed(42)
    n = 60
    x = np.sort(np.random.uniform(-3, 3, n))
    y_true = np.sin(x) + 0.3 * x
    y_noisy = y_true + np.random.normal(0, 0.4, n)

    # 80/20 train/test split
    train_mask = np.random.rand(n) < 0.75
    x_train, y_train = x[train_mask].reshape(-1, 1), y_noisy[train_mask]
    x_test, y_test = x[~train_mask].reshape(-1, 1), y_noisy[~train_mask]

    sweep_results = []
    for deg in degrees:
        poly = PolynomialFeatures(degree=deg)
        x_tr_poly = poly.fit_transform(x_train)
        x_te_poly = poly.transform(x_test)

        model = LinearRegression()
        model.fit(x_tr_poly, y_train)

        tr_pred = model.predict(x_tr_poly)
        te_pred = model.predict(x_te_poly)

        tr_mse = mean_squared_error(y_train, tr_pred)
        te_mse = mean_squared_error(y_test, te_pred)

        sweep_results.append({
            "degree": deg,
            "train_mse": round(float(tr_mse), 4),
            "test_mse": round(float(te_mse), 4),
            "regime": "Underfitting (High Bias)" if deg < 3 else ("Overfitting (High Variance)" if deg > 5 else "Optimal Tradeoff")
        })

    return sweep_results

