---
title: "A visual map of AI model types: 50+ tasks explained, with healthcare examples"
description: "What can AI models actually do? An interactive map of 50+ AI task types, from image segmentation to speech recognition and time-series forecasting, each explained in plain language with a healthcare example."
date: 2026-11-24 12:00:00
last_modified_at: 2026-11-24
slug: visual-map-of-ai-model-types-healthcare
tags:
  - Artificial Intelligence
  - Machine Learning
  - AI in Healthcare
  - Computer Vision
  - Natural Language Processing
  - Digital Health
extra_css:
  - /assets/css/experiments.css
  - /assets/css/ai-task-map.css
extra_js:
  - /assets/js/experiments/ai-task-map.js
---

"AI" is not one thing. A model that outlines a tumour on an MRI, one that transcribes a consultation and one that forecasts glucose levels have little in common except that they learned from data. A useful way to make sense of the field is to sort models by **task**: what goes in, what comes out, and what the model does in between. This post maps more than 50 task types, explains each in a sentence, and gives a concrete example of how it applies to healthcare.

## Three questions that classify any AI model

<div class="aiconcept">
  <div>
    <h3>1. What goes in?</h3>
    <p><span class="chip m-text">text</span> <span class="chip m-image">image</span> <span class="chip m-video">video</span> <span class="chip m-audio">audio</span> <span class="chip m-table">table</span> <span class="chip m-timeseries">time series</span> <span class="chip m-graph">graph</span></p>
    <p>The <strong>modality</strong> of the input. Models that take several at once are called <strong>multimodal</strong>.</p>
  </div>
  <div>
    <h3>2. What comes out?</h3>
    <p><span class="chip o-label">label</span> <span class="chip o-mask">pixel mask</span> <span class="chip o-number">number</span> <span class="chip o-vector">vector</span> <span class="chip o-text">text</span> <span class="chip o-image">image</span></p>
    <p>Filled chips are <strong>analysis</strong> results (a class, a location, a value). Outlined chips are new <strong>content</strong>.</p>
  </div>
  <div>
    <h3>3. Does it analyse or generate?</h3>
    <p><strong>Analysing</strong> (discriminative) models answer "what is this?" or "where is it?". <strong>Generative</strong> models create something new: a sentence, an image, a voice.</p>
    <p>In healthcare most validated tools so far are analytical. Generative tools are newer and need closer checking.</p>
  </div>
</div>

A fourth question matters in practice: **how much labelled data does it need?** "Zero-shot" tasks work with labels you type at run time, which is useful when no annotated dataset exists yet, a common situation in medicine.

## The map: from input to output

Every task type below turns one kind of data into another. The matrix counts them. The busy cells (text → text, image → label) are where most tools exist today. The empty cells are the gaps.

<div class="mlv-demo" data-aitask="matrix"><noscript>The interactive matrix needs JavaScript. All task types are listed below.</noscript></div>

## Common clinical questions and the task that answers them

| Clinical or operational question | Task type | Input → output |
|---|---|---|
| "Does this retinal photo show diabetic retinopathy?" | [Image Classification](#image-classification) | image → label |
| "Where exactly is the tumour, and how big is it?" | [Image Segmentation](#image-segmentation) | image → pixel mask |
| "How many cells or nodules are there?" | [Object Detection](#object-detection) | image → boxes |
| "Can we write the note while I talk to the patient?" | [Speech Recognition](#automatic-speech-recognition) + [Summarization](#summarization) | audio → text |
| "Which medications are mentioned in these notes?" | [Token Classification](#token-classification) | text → labels per word |
| "Is this patient at risk of readmission?" | [Tabular Classification](#tabular-classification) | table → label |
| "What will this patient's glucose be in an hour?" | [Time Series Forecasting](#time-series-forecasting) | time series → number |
| "Is there a murmur in this heart sound?" | [Audio Classification](#audio-classification) | audio → label |
| "Which trials could this patient join?" | [Sentence Similarity](#sentence-similarity) | text → score |
| "Has this patient's gait improved after physiotherapy?" | [Keypoint Detection](#keypoint-detection) | video frames → keypoints |
| "Could this molecule work as a drug?" | [Graph Machine Learning](#graph-machine-learning) | graph → number |

## All task types

Filter by area, by whether the model analyses or generates, or search for a word such as "ECG", "tumour" or "notes".

<div class="aifilter" data-aitask="filters"></div>

{% include ai-task-cards.html %}

## Real systems combine several tasks

Useful healthcare tools are rarely a single model. They are **pipelines** of tasks, each doing one job:

- **Ambient clinical documentation:** [Voice Activity Detection](#voice-activity-detection) → [Speech Recognition](#automatic-speech-recognition) → [Token Classification](#token-classification) (find medications and diagnoses) → [Summarization](#summarization) into a draft note.
- **A chatbot that answers from trusted guidelines** (retrieval-augmented generation): [Feature Extraction](#feature-extraction) to index the guidelines → [Text Ranking](#text-ranking) to pick the best passages → [Text Generation](#text-generation) to answer, citing them.
- **Radiotherapy planning support:** [Image-to-Image](#image-to-image) to denoise the scan → [Image Segmentation](#image-segmentation) to outline the tumour and organs → [Tabular Regression](#tabular-regression) to estimate the dose to each organ.
- **Remote rehabilitation:** [Keypoint Detection](#keypoint-detection) on home video → [Time Series Forecasting](#time-series-forecasting) of recovery → [Text Generation](#text-generation) for a patient-friendly progress report.

Breaking a problem into tasks like this makes it easier to choose the right model for each step, to measure each step separately, and to see where errors come from.

## Using these models responsibly in healthcare

The task tells you *what a model can do*, not *whether it is safe to use*. Before any AI touches patient care:

1. **Validate on local data.** A model trained in one hospital, country or scanner type can perform worse elsewhere.
2. **Check for bias.** Measure performance across age, sex, skin tone, ethnicity and other relevant groups, not just on average.
3. **Keep a human in the loop.** Most tasks above are best used to support, not replace, clinical judgement, especially generative ones, which can produce confident but wrong output.
4. **Protect privacy.** Health data is sensitive personal data under the GDPR. Running models locally or on approved infrastructure is often required.
5. **Know the regulation.** Software that informs diagnosis or treatment may be a medical device (in the EU, under the Medical Device Regulation), and the EU AI Act adds requirements for high-risk AI systems.

## Key takeaways

- Classify any AI model by **input**, **output**, and whether it **analyses or generates**.
- Most clinical problems map to a small set of tasks: **classification, detection, segmentation, speech recognition, information extraction and forecasting**.
- **Zero-shot** tasks help when labelled medical data is scarce.
- Real tools are **pipelines** of tasks, and each step must be validated.

To see how some of these models work inside, try my [interactive guide to machine learning and neural networks](/experiments/machine-learning-visual-guide/). If you run models on your own computer, [this visual guide to local LLMs](/blog/local-llms-explained-model-names-quantization-lm-studio/) explains model names, quantisation and settings.
