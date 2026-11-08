---
title: "Starting a PhD in Biomedical Engineering after 12 years in industry"
description: "Why I started a PhD in Biomedical Engineering and Biophysics at the University of Lisbon after 12+ years as a software engineer and product owner, and what I expect the first year to look like."
date: 2026-11-08
last_modified_at: 2026-11-08
slug: starting-a-phd-in-biomedical-engineering
tags:
  - PhD
  - Biomedical Engineering
  - Biophysics
  - AI in Healthcare
  - Career Change
  - Digital Health
---

In September 2026 I started a PhD in Biomedical Engineering and Biophysics at the Faculty of Sciences of the University of Lisbon (FCUL). I'm doing it after more than twelve years building software, managing products and running my own company. This post is about why I made that move, what carries over from industry, and how I'm approaching the first year.

## Why a PhD, and why now?

For most of my career, my work has been about turning messy requirements into software that people actually use. I started as a full-stack engineer, spent more than eight years at Vodafone Portugal (first in content management, then as a Product Owner), and in 2022 founded Macroanalytica to build software and IT solutions on my own terms.

Along the way, two things kept pulling my attention towards healthcare:

1. **AI was moving from demos to real clinical questions.** Machine learning models are now being evaluated against imaging, signals and patient records. The hard part is no longer "can a model fit this data?" but "can we trust it, explain it and deploy it safely?"
2. **The gap between engineering and medicine is still wide.** Good models fail because they don't fit clinical workflows, the data pipelines are fragile, or nobody involved speaks both languages. That gap is an engineering and product problem as much as a scientific one.

I prepared deliberately. I finished a BSc in Systems and Computer Management at Atlântica University (2023–2026) while working, and completed a MicroMasters in Artificial Intelligence and Machine Learning in Healthcare. At some point, studying the field on the side stopped being enough. I wanted to do research properly: with a method, with peer review, and with people who know far more biology and physics than I do.

## What carries over from industry?

More than I expected, though not always in obvious ways.

- **Shipping software.** Research code tends to be written once and abandoned. Years of maintaining production systems make me want reproducible environments, version control, tests and documentation from day one, because a result you can't re-run isn't really a result.
- **Product thinking.** As a Product Owner, the most valuable question was always "who is this for, and what problem does it solve for them?" It's the same question a good research proposal has to answer, especially in healthcare, where the "user" might be a clinician, a patient or a regulator.
- **Working with ambiguity and stakeholders.** Requirements change, priorities collide, and you still have to deliver. Research has its own version of this.
- **Teaching.** I'm also a certified trainer (CCP) and teach ICT in vocational programmes. Explaining a concept to a classroom is a good test of whether I really understand it, and that habit is useful when reading papers.

## What is genuinely new?

Biophysics and biomedical engineering need foundations I didn't use much as a software engineer: physiology, signal processing, the physics of measurement, and statistics done carefully rather than conveniently. In industry, "good enough to ship" is a valid end state. In science, the question is what you can *claim*, with what uncertainty, and under what assumptions.

The rhythm is different too. A sprint lasts two weeks. A research question can take a year just to frame well. Learning to be patient with that, without losing the bias towards action that industry gave me, is probably the main skill I need to build.

## Which research directions am I exploring?

I'm still in the early, exploratory phase, but the themes I keep coming back to are:

- **Machine learning in healthcare**: models for biomedical data that are robust, interpretable and honest about their uncertainty.
- **Digital twins and computer simulation**: computational models of physiological systems that can be personalised and used to test "what if?" scenarios.
- **Edge computing (RISC-V)**: running inference close to where data is collected, such as wearables and medical devices, for privacy, latency and cost.
- **Biomedical data analysis**: the unglamorous but essential work of cleaning, validating and understanding real clinical and physiological data.

These directions will narrow as I read more and talk with researchers in the field. Part of the point of this blog is to document that narrowing in public.

## How am I approaching the first year?

A few habits I'm committing to:

1. **A reading log.** Every paper gets a short note: the question, the method, the data, the main result and my doubts. Writing it down is the only way I remember anything a month later.
2. **Writing every week.** I write my notes in LaTeX, and some of them will become posts here. Writing exposes gaps in understanding faster than anything else.
3. **Reproducible by default.** Every experiment lives in a repository with its environment pinned and a README explaining how to re-run it.
4. **Learning in public.** The [Experiments](/experiments/) section of this site is where I build small interactive explainers. The first is a [visual guide to machine learning methods and neural networks](/experiments/machine-learning-visual-guide/), made partly to sharpen my own intuitions.
5. **Keeping one foot in practice.** I'll keep building software and teaching. I see these as a source of grounding, not a distraction.

## Key takeaways

- Moving from industry to a PhD is not starting over. Engineering discipline, product thinking and teaching all transfer, even if the vocabulary changes.
- The biggest adjustment is epistemic: going from "does it work?" to "what can I rigorously claim?"
- AI in healthcare needs people who can bridge software engineering, data science and clinical reality. That bridge is where I want to work.

If you're considering a similar move, or you work on AI in healthcare, digital twins or biomedical signal analysis, I'd be glad to hear from you on [LinkedIn](https://www.linkedin.com/in/luis-rebelo) or [GitHub](https://github.com/luismsrebelo).
