# ApxForge Quantitative Analytics — Statistical Rigor & Methodology

ApxForge enforces formal inferential statistics and econometric testing to eliminate p-hacking, overfitting, and data leakage in systematic financial strategies.

---

## 1. Hypothesis Testing Suite (`services/statistics.py`)

### 1.1 One-Sample & Two-Sample T-Tests
- **One-Sample t-test**: Tests whether an asset's expected daily excess return differs significantly from zero:
  $$t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}}$$
- **Independent Two-Sample Student's t-test**: Assumes equal variances:
  $$s_p = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1 + n_2 - 2}}, \quad t = \frac{\bar{x}_1 - \bar{x}_2}{s_p \sqrt{\frac{1}{n_1} + \frac{1}{n_2}}}$$
- **Welch's t-test**: Robust to unequal variances (heteroscedasticity common in market regimes):
  $$\nu \approx \frac{\left(\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}\right)^2}{\frac{(s_1^2/n_1)^2}{n_1-1} + \frac{(s_2^2/n_2)^2}{n_2-1}}$$

### 1.2 Analysis of Variance (ANOVA) & Tukey HSD
- **One-Way ANOVA**: Evaluates whether the mean return across multiple asset classes or sectors is identical:
  $$F = \frac{\text{MS}_{\text{between}}}{\text{MS}_{\text{within}}}$$
- **Post-Hoc Tukey Honestly Significant Difference (HSD)**: Computes studentized range statistics $q$ for all pairwise group contrasts, controlling family-wise error rate (FWER).

### 1.3 Chi-Square Test of Independence
- Evaluates categorical dependency between market conditions (e.g., Bull/Bear regime vs. Option In-The-Money frequency):
  $$\chi^2 = \sum \frac{(O_i - E_i)^2}{E_i}$$

### 1.4 Multiple Comparison Corrections
When testing hundreds of alpha signals simultaneously, false positive rates explode:
- **Bonferroni Correction**:
  $$\alpha_{\text{adjusted}} = \frac{\alpha}{m}$$
- **False Discovery Rate (FDR / Benjamini-Hochberg)**:
  Controls the expected proportion of false discoveries:
  $$P_{(k)} \le \frac{k}{m} Q$$

---

## 2. Model Complexity & Bias-Variance Decomposition

The **Bias-Variance Sweep** module (`/stats-lab`) evaluates polynomial regressions of degrees $d \in [1, 15]$:
$$\text{MSE} = \text{Bias}^2 + \text{Variance} + \sigma^2$$
- Low degrees ($d=1, 2$) exhibit high bias (underfitting).
- High degrees ($d \ge 8$) exhibit explosive out-of-sample error and severe variance (overfitting).
- Identifies the sweet spot minimizing Akaike Information Criterion (AIC) and Bayesian Information Criterion (BIC).

---

## 3. Financial Cross-Validation & Data Leakage Prevention

Standard K-Fold cross-validation randomly shuffles observations, which causes **severe lookahead bias** when applied to financial time series. ApxForge demonstrates this empirically via the CV comparison engine:
- **K-Fold**: Random train/test splits inadvertently condition predictions on future price data.
- **TimeSeriesSplit (Walk-Forward Validation)**: Enforces expanding historical training windows with strictly subsequent testing windows, preserving temporal causality.
