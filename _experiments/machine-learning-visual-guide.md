---
title: "Machine Learning, Visually: An Interactive Guide to ML Methods and Neural Networks"
description: "Interactive visual guide to machine learning: regression, k-NN, decision trees, SVM, k-means, PCA, neural networks, CNNs and attention, all trainable in your browser."
date: 2026-11-08
last_modified_at: 2026-11-08
permalink: /experiments/machine-learning-visual-guide/
learning_resource_type: "Interactive visualisation"
educational_level: "Beginner to intermediate"
teaches:
  - "Linear regression"
  - "Logistic regression"
  - "k-nearest neighbours"
  - "Decision trees"
  - "Support vector machines"
  - "k-means clustering"
  - "Principal component analysis"
  - "Multilayer perceptrons and backpropagation"
  - "Convolutional neural networks"
  - "Self-attention and transformers"
tags:
  - Machine Learning
  - Neural Networks
  - Deep Learning
  - Data Visualisation
  - AI in Healthcare
extra_css:
  - /assets/css/experiments.css
extra_js:
  - /assets/js/experiments/ml-visual-guide.js
---

**Machine learning** is the practice of teaching computers to find patterns in data instead of following hand-written rules. This page shows ten of the most important methods as small interactive experiments that run entirely in your browser, with no libraries and nothing sent to a server. Press *Train*, move the sliders and watch each model learn.

Every method answers one of three questions:

<div class="mlv-map">
  <div class="mlv-map__group">
    <h3>Supervised learning</h3>
    <p>Learn from labelled examples.</p>
    <ul>
      <li><a href="#linear-regression">Linear regression</a></li>
      <li><a href="#logistic-regression">Logistic regression</a></li>
      <li><a href="#k-nearest-neighbours-k-nn">k-nearest neighbours</a></li>
      <li><a href="#decision-trees">Decision trees</a></li>
      <li><a href="#support-vector-machines-svm">Support vector machines</a></li>
    </ul>
  </div>
  <div class="mlv-map__group">
    <h3>Unsupervised learning</h3>
    <p>Find structure without labels.</p>
    <ul>
      <li><a href="#k-means-clustering">k-means clustering</a></li>
      <li><a href="#principal-component-analysis-pca">Principal component analysis</a></li>
    </ul>
  </div>
  <div class="mlv-map__group">
    <h3>Deep learning</h3>
    <p>Stack many simple units to learn representations.</p>
    <ul>
      <li><a href="#neural-networks-multilayer-perceptron">Neural networks (MLP)</a></li>
      <li><a href="#convolutional-neural-networks-cnn">Convolutional networks</a></li>
      <li><a href="#transformers-and-self-attention">Transformers and attention</a></li>
      <li><a href="#other-neural-network-architectures">Other architectures</a></li>
    </ul>
  </div>
</div>

In the 2D classification demos, each dot is an example with two features (its horizontal and vertical position), and its colour is its class. The shaded background shows what the model would predict for a new point at that location: its **decision boundary**.

## Linear regression

**Linear regression** predicts a continuous number by fitting a straight line (or a plane, in more dimensions) that minimises the **mean squared error** between predictions and observed values. Here it is trained with **gradient descent**: at every step, the slope and intercept move a little in the direction that reduces the error the most.

<div class="mlv-demo" data-demo="linreg"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* estimating a continuous outcome, such as blood pressure from age and body-mass index. *Strengths:* fast, interpretable coefficients. *Limitations:* only captures linear relationships unless you engineer extra features.

## Logistic regression

**Logistic regression** is a classification method despite its name. It computes a weighted sum of the inputs and passes it through the **sigmoid function**, which turns any number into a probability between 0 and 1. It is trained by minimising the **log-loss** (cross-entropy). The decision boundary, where the probability is exactly 50%, is always a straight line.

<div class="mlv-demo" data-demo="logreg"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* clinical risk scores, such as the probability that a patient has a condition given a few measurements. It remains a strong, well-calibrated baseline in medical research.

## k-nearest neighbours (k-NN)

**k-nearest neighbours** has no training phase at all. To classify a new point, it finds the *k* closest labelled examples and takes a **majority vote**. A small *k* gives jagged, noisy boundaries that overfit. A large *k* gives smooth boundaries that may underfit. Move your pointer over the chart and change *k* to see this.

<div class="mlv-demo" data-demo="knn"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* finding similar past patients ("patients like this one") for case-based reasoning. *Watch out:* features must be on comparable scales, and prediction gets slow on large datasets.

## Decision trees

A **decision tree** splits the data with a sequence of yes/no questions on one feature at a time ("is x ≤ 0.3?"), choosing each split to make the resulting groups as pure as possible (here measured with **Gini impurity**). The result is axis-aligned rectangular regions. Increase the depth and watch the tree memorise the training data: this is **overfitting**.

<div class="mlv-demo" data-demo="tree"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* triage rules clinicians can read and audit. Ensembles of many trees (**random forests**, **gradient boosting** such as XGBoost) are among the most accurate methods for tabular clinical data.

## Support vector machines (SVM)

A **support vector machine** looks for the boundary with the **widest margin**, the largest gap between the two classes. Only the points on or inside the margin, the **support vectors**, determine the boundary. The regularisation parameter λ trades margin width against training errors. With the **kernel trick**, SVMs can also draw curved boundaries.

<div class="mlv-demo" data-demo="svm"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* classifying high-dimensional, small-sample data such as gene-expression profiles, where SVMs were long a standard tool.

## k-means clustering

**k-means** groups unlabelled data into *k* clusters by repeating two steps until nothing changes: (1) **assign** every point to its nearest centroid, (2) **move** each centroid to the mean of its assigned points. Press *Step* to see each half of the algorithm, and try a *k* that doesn't match the real number of groups.

<div class="mlv-demo" data-demo="kmeans"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* discovering patient subgroups (phenotypes) from routine measurements. *Watch out:* you must choose *k*, results depend on the starting centroids, and clusters are assumed to be roughly round.

## Principal component analysis (PCA)

**Principal component analysis** finds the directions along which the data varies the most. These **principal components** are the eigenvectors of the covariance matrix. Projecting onto the first few components reduces the number of dimensions while keeping most of the information, which is useful for visualisation, compression and denoising.

<div class="mlv-demo" data-demo="pca"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* summarising hundreds of correlated lab values or omics measurements into a few components before visualisation or modelling.

## Neural networks (multilayer perceptron)

A **neural network** is layers of simple units ("neurons"). Each computes a weighted sum of its inputs and passes it through a non-linear **activation function** such as tanh or ReLU. Stacking layers lets the network bend the decision boundary into almost any shape. It learns by **backpropagation**: computing how much each weight contributed to the error, then adjusting it with an optimiser (here **Adam**).

This playground trains a real network from scratch in your browser. Try the *Spiral* dataset with *1 neuron* (it can't solve it), then with *8 → 8 → 8*.

<div class="mlv-demo" data-demo="neuralnet"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Things to try:* a learning rate of 0.1 often trains faster but less stably. ReLU produces piecewise-linear boundaries, while tanh produces smooth ones.

## Convolutional neural networks (CNN)

A **convolutional neural network** is built for images and other grid-like signals. Its key operation is the **convolution**: a small grid of weights (a **kernel** or filter) slides across the image, and at each position it multiplies and sums the pixels underneath. This produces a **feature map** that lights up wherever the pattern appears. Because the same weights are reused everywhere (**weight sharing**), CNNs need far fewer parameters than fully connected networks and detect a pattern wherever it occurs.

In a trained CNN the kernels are *learned*. Early layers end up detecting edges like the ones below, and deeper layers combine them into textures, shapes and objects.

<div class="mlv-demo" data-demo="convolution"><noscript>This interactive demo needs JavaScript.</noscript></div>

*Healthcare example:* medical imaging, including detecting diabetic retinopathy in retinal photographs, finding nodules in CT scans, and segmenting tumours in MRI.

## Transformers and self-attention

**Transformers** are the architecture behind modern large language models. Their core mechanism is **self-attention**: for each token, the model computes how relevant every other token is (a set of weights that sum to 1 via softmax), then builds a new representation as a weighted mix of them. This lets every word directly "look at" every other word, regardless of distance. Hover over or focus the tokens below. Notice how "it" attends to "drug", resolving what "it" refers to.

<div class="mlv-demo" data-demo="attention"><noscript>This interactive demo needs JavaScript.</noscript></div>

The weights above are hand-set to illustrate the idea. In a real transformer, they are computed from learned *query*, *key* and *value* projections, across many attention heads and layers.

*Healthcare example:* summarising clinical notes, extracting information from reports, and modelling sequences such as patient histories or protein structures.

## Other neural network architectures

<div class="mlv-arch">
  <figure>
    <svg viewBox="0 0 240 130" role="img" aria-labelledby="perc-t perc-d">
      <title id="perc-t">Perceptron</title>
      <desc id="perc-d">Three inputs connect with weights to a summation node, followed by an activation function producing one output.</desc>
      <path class="e" d="M38,25 L118,65 M38,65 L118,65 M38,105 L118,65 M142,65 L168,65 M212,65 L232,65"/>
      <circle class="n-in" cx="30" cy="25" r="9"/><circle class="n-in" cx="30" cy="65" r="9"/><circle class="n-in" cx="30" cy="105" r="9"/>
      <text class="t" x="6" y="29">x₁</text><text class="t" x="6" y="69">x₂</text><text class="t" x="6" y="109">x₃</text>
      <text class="t" x="70" y="38">w₁</text><text class="t" x="72" y="60">w₂</text><text class="t" x="70" y="96">w₃</text>
      <circle class="n" cx="130" cy="65" r="13"/><text class="t" x="125" y="69">Σ</text>
      <rect class="box" x="168" y="52" width="44" height="26" rx="4"/><text class="t" x="176" y="69">f(·)</text>
      <circle class="n-out" cx="232" cy="65" r="6"/>
    </svg>
    <figcaption><strong>Perceptron</strong> (1958): a single neuron, meaning a weighted sum plus an activation. On its own it can only draw a straight line. Stacking many of them gives the multilayer perceptron above.</figcaption>
  </figure>
  <figure>
    <svg viewBox="0 0 240 130" role="img" aria-labelledby="rnn-t rnn-d">
      <title id="rnn-t">Recurrent neural network, unrolled in time</title>
      <desc id="rnn-d">Three copies of the same cell process inputs x1 to x3 in order, passing a hidden state from left to right and emitting outputs y1 to y3.</desc>
      <rect class="box" x="20" y="48" width="50" height="34" rx="5"/><rect class="box" x="95" y="48" width="50" height="34" rx="5"/><rect class="box" x="170" y="48" width="50" height="34" rx="5"/>
      <text class="t" x="39" y="69">h₁</text><text class="t" x="114" y="69">h₂</text><text class="t" x="189" y="69">h₃</text>
      <path class="e" d="M70,65 L95,65 M145,65 L170,65 M45,112 L45,82 M120,112 L120,82 M195,112 L195,82 M45,48 L45,22 M120,48 L120,22 M195,48 L195,22" stroke-width="1.6"/>
      <circle class="n-in" cx="45" cy="116" r="6"/><circle class="n-in" cx="120" cy="116" r="6"/><circle class="n-in" cx="195" cy="116" r="6"/>
      <circle class="n-out" cx="45" cy="16" r="6"/><circle class="n-out" cx="120" cy="16" r="6"/><circle class="n-out" cx="195" cy="16" r="6"/>
      <text class="t" x="55" y="120">x₁</text><text class="t" x="130" y="120">x₂</text><text class="t" x="205" y="120">x₃</text>
    </svg>
    <figcaption><strong>Recurrent neural network (RNN / LSTM / GRU)</strong>: processes a sequence one step at a time and carries a hidden state forward as memory. Used for time series such as ECG signals and vital-sign monitoring. Largely superseded by transformers for text.</figcaption>
  </figure>
  <figure>
    <svg viewBox="0 0 240 130" role="img" aria-labelledby="ae-t ae-d">
      <title id="ae-t">Autoencoder</title>
      <desc id="ae-d">Five input neurons narrow to a two-neuron bottleneck and widen back to five output neurons that reconstruct the input.</desc>
      <path class="e" d="M25,17 L75,35 M25,41 L75,35 M25,65 L75,65 M25,89 L75,95 M25,113 L75,95 M25,65 L75,35 M25,65 L75,95 M75,35 L120,50 M75,65 L120,50 M75,65 L120,80 M75,95 L120,80 M120,50 L165,35 M120,50 L165,65 M120,80 L165,65 M120,80 L165,95 M165,35 L215,17 M165,35 L215,41 M165,65 L215,65 M165,95 L215,89 M165,95 L215,113 M165,65 L215,41 M165,65 L215,89"/>
      <circle class="n-in" cx="25" cy="17" r="6"/><circle class="n-in" cx="25" cy="41" r="6"/><circle class="n-in" cx="25" cy="65" r="6"/><circle class="n-in" cx="25" cy="89" r="6"/><circle class="n-in" cx="25" cy="113" r="6"/>
      <circle class="n" cx="75" cy="35" r="6"/><circle class="n" cx="75" cy="65" r="6"/><circle class="n" cx="75" cy="95" r="6"/>
      <circle class="n-mid" cx="120" cy="50" r="7"/><circle class="n-mid" cx="120" cy="80" r="7"/>
      <circle class="n" cx="165" cy="35" r="6"/><circle class="n" cx="165" cy="65" r="6"/><circle class="n" cx="165" cy="95" r="6"/>
      <circle class="n-out" cx="215" cy="17" r="6"/><circle class="n-out" cx="215" cy="41" r="6"/><circle class="n-out" cx="215" cy="65" r="6"/><circle class="n-out" cx="215" cy="89" r="6"/><circle class="n-out" cx="215" cy="113" r="6"/>
      <text class="t" x="98" y="126">bottleneck</text>
    </svg>
    <figcaption><strong>Autoencoder</strong>: learns to compress its input into a small <em>bottleneck</em> and reconstruct it. It works like a non-linear PCA. Used for denoising medical images and for anomaly detection, where inputs that reconstruct badly are unusual.</figcaption>
  </figure>
  <figure>
    <svg viewBox="0 0 240 150" role="img" aria-labelledby="tr-t tr-d">
      <title id="tr-t">Transformer block</title>
      <desc id="tr-d">Token embeddings plus positional encodings flow through multi-head self-attention, add and normalise, a feed-forward network, and add and normalise again, with residual connections.</desc>
      <rect class="box" x="40" y="122" width="160" height="22" rx="4"/><text class="t" x="58" y="137">tokens + positions</text>
      <rect class="box" x="40" y="88" width="160" height="22" rx="4" style="stroke:#2f7f93"/><text class="t" x="52" y="103">multi-head self-attention</text>
      <rect class="box" x="40" y="62" width="160" height="18" rx="4"/><text class="t" x="94" y="75">add &amp; norm</text>
      <rect class="box" x="40" y="32" width="160" height="22" rx="4" style="stroke:#e07a2f"/><text class="t" x="70" y="47">feed-forward</text>
      <rect class="box" x="40" y="6" width="160" height="18" rx="4"/><text class="t" x="94" y="19">add &amp; norm</text>
      <path class="e" d="M120,122 L120,110 M120,88 L120,80 M120,62 L120,54 M120,32 L120,24" stroke-width="1.6"/>
      <path class="e" d="M200,133 C228,133 228,71 200,71 M200,71 C228,71 228,15 200,15" stroke-dasharray="3 3"/>
      <text class="t" x="206" y="44">×N</text>
    </svg>
    <figcaption><strong>Transformer block</strong>: self-attention mixes information between tokens, and a feed-forward network processes each token. Residual connections (dashed) keep training stable. Dozens of these blocks stacked together form a large language model.</figcaption>
  </figure>
</div>

## Which machine learning method should I use?

<div class="mlv-table-wrap" markdown="1">

| Method | Type | Best for | Interpretability | Needs lots of data? |
|---|---|---|---|---|
| Linear regression | Supervised: regression | Continuous outcomes, baselines | High | No |
| Logistic regression | Supervised: classification | Risk scores, calibrated probabilities | High | No |
| k-nearest neighbours | Supervised | Small datasets, similarity search | Medium | No, but slow at scale |
| Decision tree / random forest / boosting | Supervised | Tabular data with mixed feature types | High (single tree) to medium | Moderate |
| Support vector machine | Supervised | High-dimensional, small-sample data | Low–medium | No |
| k-means | Unsupervised: clustering | Finding subgroups | Medium | No |
| PCA | Unsupervised: dimensionality reduction | Visualisation, compression | Medium | No |
| Multilayer perceptron | Deep learning | Non-linear patterns in tabular data | Low | Yes |
| CNN | Deep learning | Images, signals, spatial data | Low | Yes (or transfer learning) |
| RNN / LSTM | Deep learning | Time series, sequences | Low | Yes |
| Transformer | Deep learning | Text, long sequences, multimodal data | Low | Very (usually pre-trained) |

</div>

A good rule of thumb: **start with the simplest model that could work** (logistic regression or a gradient-boosted tree for tabular data) and only move to deep learning when the data is unstructured (images, text, signals) or plentiful enough to justify it. In healthcare, interpretability and calibration often matter as much as raw accuracy.

## Frequently asked questions

### What is the difference between machine learning and deep learning?
Deep learning is the subset of machine learning that uses neural networks with many layers. Classic machine learning methods (regression, trees, SVMs, k-means) usually rely on hand-crafted features. Deep learning learns the features directly from raw data such as pixels or text.

### What is the difference between supervised and unsupervised learning?
Supervised learning trains on examples with known answers (labels) to predict those answers for new data. Unsupervised learning has no labels and looks for structure, such as clusters or low-dimensional patterns.

### What is overfitting?
Overfitting is when a model learns the noise in its training data rather than the underlying pattern, so it performs well on training data but poorly on new data. Try it in the decision tree demo by setting the maximum depth to 10, or in the k-NN demo with k = 1.

### How does a neural network learn?
It makes a prediction, measures the error with a loss function, uses backpropagation (the chain rule of calculus) to compute how each weight affected that error, and nudges every weight to reduce it. Repeating this thousands of times is gradient-based training.

### How were these visualisations built?
Every model on this page, including the neural network with backpropagation and the Adam optimiser, is implemented from scratch in about a thousand lines of plain JavaScript and drawn on an HTML canvas. Nothing is sent to a server. The [source code is on GitHub](https://github.com/luismsrebelo/luismsrebelo.github.io/blob/main/assets/js/experiments/ml-visual-guide.js).

---

*Built by [Luís Rebelo](/) as part of learning in public during a PhD in Biomedical Engineering and Biophysics. Read more on the [blog](/blog/starting-a-phd-in-biomedical-engineering/).*
