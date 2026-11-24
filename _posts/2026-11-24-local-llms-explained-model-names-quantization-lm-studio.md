---
title: "Local LLMs, explained visually: model names, quantisation and LM Studio settings"
description: "What does Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf mean? A visual guide to LLM model names, parameters, Mixture-of-Experts, quantisation, memory, context length and LM Studio settings."
date: 2026-11-24
last_modified_at: 2026-11-24
slug: local-llms-explained-model-names-quantization-lm-studio
tags:
  - Large Language Models
  - LM Studio
  - Local AI
  - Quantization
  - Mixture of Experts
  - Qwen
extra_css:
  - /assets/css/experiments.css
  - /assets/css/llm-guide.css
extra_js:
  - /assets/js/experiments/llm-guide.js
---

If you run AI models on your own computer with a tool like **LM Studio**, you quickly meet file names like `Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf` and a settings panel full of options. This post decodes all of it with interactive visuals: what each part of a model name means, how much memory a model needs, why some 30B models run as fast as 3B ones, and which LM Studio settings actually matter.

## Decoding a model name

A model file name is a compact spec sheet. Every part tells you something about the model:

<div class="mlv-demo" data-llm="name"><noscript>Interactive decoder needs JavaScript. See the table below.</noscript></div>

| Part | Meaning | In plain words |
|---|---|---|
| **Qwen** | Model family | Made by the Qwen team at Alibaba Cloud (short for *Tongyi Qianwen*) |
| **3** | Generation | Third major version of the family |
| **Coder** | Specialisation | Extra training on code and tool use |
| **30B** | Total parameters | ~30.5 billion learned numbers |
| **A3B** | Active parameters | Only ~3.3 billion are used per token (Mixture-of-Experts) |
| **Instruct** | Fine-tuning | Tuned to follow instructions and chat, not just continue text |
| **Q4_K_M** | Quantisation | Weights compressed to ~4.8 bits each (llama.cpp "k-quant", medium) |
| **.gguf** | File format | llama.cpp's single-file format with weights + tokenizer + chat template |

The LM Studio info panel shows the same facts in a different form: **Arch `qwen3moe`** (the Qwen3 Mixture-of-Experts architecture), **Format GGUF**, **Quantization Q4_K_M**, **Size on disk 18.63 GB**, and the **Tool use** capability, which means the model was trained to call functions, the basis of coding agents.

## What happens when a model generates text?

Before looking at settings, it helps to see where they plug in. A language model only ever does one thing: given the text so far, it produces a probability for every possible next **token** (a word or word piece). A **sampler** picks one, it is appended, and the loop repeats.

<figure class="llm-flow">
  <svg viewBox="0 0 700 190" role="img" aria-labelledby="flow-t flow-d">
    <title id="flow-t">How an LLM generates text</title>
    <desc id="flow-d">The prompt is split into tokens, passed through the model's layers to produce next-token probabilities, the sampler picks one token, and it is appended to the prompt in a loop. Load settings affect the model step; inference settings affect the sampler step.</desc>
    <defs><marker id="llm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>
    <rect class="box" x="5" y="40" width="110" height="50" rx="6"/><text class="t" x="20" y="62">Your prompt</text><text class="s" x="20" y="78">+ system prompt</text>
    <rect class="box" x="145" y="40" width="110" height="50" rx="6"/><text class="t" x="165" y="62">Tokenizer</text><text class="s" x="160" y="78">text → token IDs</text>
    <rect class="box" x="285" y="30" width="130" height="70" rx="6" style="stroke:#2f7f93;stroke-width:2.5"/><text class="t" x="300" y="55">Model</text><text class="s" x="300" y="72">48 transformer layers</text><text class="s" x="300" y="87">weights + KV cache</text>
    <rect class="box" x="445" y="40" width="110" height="50" rx="6"/><text class="t" x="458" y="62">Probabilities</text><text class="s" x="458" y="78">for ~150K tokens</text>
    <rect class="box" x="585" y="40" width="110" height="50" rx="6" style="stroke:#e07a2f;stroke-width:2.5"/><text class="t" x="605" y="62">Sampler</text><text class="s" x="600" y="78">picks 1 token</text>
    <path class="a" d="M115,65 L143,65"/><path class="a" d="M255,65 L283,65"/><path class="a" d="M415,65 L443,65"/><path class="a" d="M555,65 L583,65"/>
    <path class="a" d="M640,40 C640,8 60,8 60,38"/><text class="s" x="290" y="14">append token and repeat</text>
    <text class="t" x="290" y="130" style="fill:#2f7f93">LM Studio "Load" tab</text><text class="s" x="290" y="146">context, GPU offload, KV cache,</text><text class="s" x="290" y="160">Flash Attention, experts</text>
    <text class="t" x="575" y="130" style="fill:#e07a2f">"Inference" tab</text><text class="s" x="575" y="146">temperature, top-k,</text><text class="s" x="575" y="160">top-p, min-p, penalties</text>
  </svg>
  <figcaption>Load settings decide <em>how the model runs</em> (memory and speed). Inference settings decide <em>how the next token is chosen</em> (style and creativity).</figcaption>
</figure>

## Parameters: what does "30B" mean?

**Parameters** (or weights) are the numbers the network learned during training. A 30B model has about 30 billion of them. Each must be stored in memory, so the first question for any local model is: *will it fit?*

**Memory for the weights ≈ parameters × bits per weight ÷ 8.** At full 16-bit precision, 30.5B parameters need about 61 GB, more than almost any consumer GPU has. That is where quantisation comes in.

## Mixture-of-Experts: why "A3B" makes a 30B model fast

In a classic **dense** model, every parameter is used for every token. A **Mixture-of-Experts (MoE)** model splits most layers into many small sub-networks, the **experts**, plus a tiny **router** that sends each token to only a few of them. Qwen3-Coder-30B-A3B has **128 experts per layer and activates 8 per token**, so only about 3.3B of its 30.5B parameters do work for any given token.

<div class="mlv-demo" data-llm="moe"><noscript>Interactive demo needs JavaScript.</noscript></div>

The trade-off:

- **Speed** depends on *active* parameters → an A3B model generates text roughly as fast as a 3B dense model.
- **Memory** depends on *total* parameters → it still needs room for all 30.5B.
- **Quality** sits between the two: much better than a 3B model, usually a bit below a 30B dense model of the same generation.

This is why MoE models are popular for local use: memory is cheaper than compute. A model can even keep its experts in ordinary system RAM and still be usable.

## Quantisation: Q8, Q6, Q4 and the K_M suffix

**Quantisation** stores each weight with fewer bits. Instead of a 16-bit number, groups of weights share a scale factor and each weight is stored in 4, 5, 6 or 8 bits. You lose a little precision but save a lot of memory and bandwidth, which also makes generation faster.

Approximate file size of a 30.5B model at common llama.cpp quantisation levels:

<div class="llm-bars" role="img" aria-label="Bar chart of approximate file size for a 30.5 billion parameter model at different quantisation levels">
  <div class="llm-bars__row"><code>F16</code><div class="llm-bars__bar" style="width:100%"></div><span>~61 GB</span></div>
  <div class="llm-bars__row"><code>Q8_0</code><div class="llm-bars__bar" style="width:53%"></div><span>~32 GB</span></div>
  <div class="llm-bars__row"><code>Q6_K</code><div class="llm-bars__bar" style="width:41%"></div><span>~25 GB</span></div>
  <div class="llm-bars__row"><code>Q5_K_M</code><div class="llm-bars__bar" style="width:36%"></div><span>~22 GB</span></div>
  <div class="llm-bars__row is-you"><code>Q4_K_M</code><div class="llm-bars__bar" style="width:30%"></div><span>~18.6 GB</span></div>
  <div class="llm-bars__row"><code>IQ4_XS</code><div class="llm-bars__bar" style="width:27%"></div><span>~16 GB</span></div>
  <div class="llm-bars__row"><code>Q3_K_M</code><div class="llm-bars__bar" style="width:24%"></div><span>~15 GB</span></div>
  <div class="llm-bars__row"><code>Q2_K</code><div class="llm-bars__bar" style="width:19%"></div><span>~11 GB</span></div>
  <p class="llm-bars__note">Estimates from average bits per weight; real files differ slightly because some tensors use other types.</p>
</div>

How to read the names:

- **The number** (Q8, Q6, Q5, Q4, Q3, Q2) is the approximate bits per weight.
- **`_0`** is the older, simple method. **`_K`** is the "k-quant" method, which uses blocks with their own scales and gives better quality per bit.
- **`_S`, `_M`, `_L`** (small, medium, large) say how many sensitive tensors are kept at higher precision.
- **`IQ`** quants use a smarter encoding (often with an "importance matrix") to squeeze out more quality at very low bit counts.

**Rules of thumb:** Q4_K_M is the sweet spot for most people. Q5_K_M or Q6_K are worth it if you have the memory. Q8_0 is practically indistinguishable from the original. Below Q4, quality drops noticeably, especially for code, where a single wrong character breaks a program. A bigger model at Q4 usually beats a smaller model at Q8.

## How much memory do you need? Weights + context

Weights are not the only thing in memory. While generating, the model keeps a **KV cache**: the attention "keys" and "values" of every previous token, so it doesn't recompute them. The KV cache grows linearly with the **context length** you choose. Try it:

<div class="mlv-demo" data-llm="memory"><noscript>Interactive calculator needs JavaScript.</noscript></div>

A few things this shows:

- For Qwen3-Coder-30B-A3B, each token of context costs about 98 KB of KV cache. **32K tokens ≈ 3.2 GB; the full 256K ≈ 26 GB.** Long context is not free.
- **Quantising the KV cache** to Q8_0 halves that with little quality loss.
- If the total is above your VRAM, LM Studio can split the model between GPU and CPU (**GPU Offload**). It works, but each layer on the CPU slows generation down.

## LM Studio settings, explained

### Load tab (how the model runs)

These are applied when the model loads. Change them and you need to reload.

| Setting | What it does | Suggested start |
|---|---|---|
| **Context Length** | Maximum tokens (prompt + answer + history) the model can see | 16K–32K for chat; more for coding agents if memory allows |
| **GPU Offload** | How many layers run on the GPU | As many as fit (max if the calculator says it fits) |
| **Number of experts** / **expert weights on CPU** (MoE only) | How many experts are used per token; whether expert weights stay in system RAM | Leave at the model default (8). Put experts on CPU if VRAM is short |
| **Flash Attention** | Faster, more memory-efficient attention | On (if supported by your GPU) |
| **K / V Cache Quantization** | Stores the KV cache in 8 or 4 bits | Q8_0 to fit longer context |
| **Offload KV Cache to GPU Memory** | Keeps the KV cache in VRAM | On, unless VRAM is very tight |
| **CPU Thread Pool Size** | CPU threads for the parts that run on CPU | Number of physical cores |
| **Evaluation Batch Size** | How many prompt tokens are processed at once | Default (512); higher can speed up long prompts |
| **RoPE Frequency Base / Scale** | Stretches the positional encoding to extend context | Leave on Auto |
| **Keep Model in Memory / Try mmap()** | Memory-loading behaviour | Defaults |
| **Seed** | Random seed for reproducible sampling | Random, or fixed when comparing settings |

### Inference tab (how the next token is chosen)

These can be changed between messages. The sampler starts from the model's probabilities and then filters and reshapes them. Play with the settings:

<div class="mlv-demo" data-llm="sampler"><noscript>Interactive demo needs JavaScript.</noscript></div>

| Setting | What it does | Low value | High value |
|---|---|---|---|
| **Temperature** | Sharpens or flattens the probabilities | Focused, repeatable (0 = always the top token) | Creative, more random |
| **Top K** | Keep only the K most likely tokens | Very safe | Little effect |
| **Top P** (nucleus) | Keep the smallest set of tokens whose probabilities add up to P | Safe, narrow | More variety |
| **Min P** | Drop tokens less likely than P × the top token's probability | Little effect | Strict |
| **Repeat Penalty** | Lowers the probability of recently used tokens | Can loop/repeat | Can avoid needed words (bad for code) |
| **Limit Response Length** | Maximum tokens in the answer | Short answers | Long answers |
| **System Prompt** | Instructions placed before every conversation | n/a | n/a |
| **Structured Output** | Forces the answer to match a JSON schema | n/a | n/a |

For **Qwen3-Coder**, the Qwen team recommends **temperature 0.7, top-p 0.8, top-k 20 and repetition penalty 1.05**. For factual or code tasks, lower temperature is generally safer. For brainstorming or writing, raise it.

## Cheat sheet: choosing a model for your machine

1. **Check your VRAM** (and RAM). The model file should be noticeably smaller than your VRAM, leaving room for context.
2. **Prefer a bigger model at Q4_K_M** over a smaller model at Q8.
3. **MoE models (with "A…B" in the name)** are the best choice if you have lots of system RAM but a modest GPU.
4. **Pick the variant for the job:** *Instruct* for chat, *Coder* for programming, *VL* for images, *Embedding* for search.
5. **Set context length deliberately.** Start at 16K–32K and raise it only if you need it.
6. **Use the model card's recommended sampling settings** before tweaking.

## Key takeaways

- A model name is a spec sheet: **family + generation + specialisation + size + active size + tuning + quantisation + format**.
- **Memory ≈ weights (params × bits ÷ 8) + KV cache (grows with context) + overhead.**
- **MoE** models store many parameters but use few per token: big-model knowledge at small-model speed.
- **Q4_K_M** is the usual sweet spot. Long context can cost as much memory as the weights.
- **Load settings** control speed and memory; **inference settings** control style and randomness.

If you want to see how the layers inside these models work, my [interactive guide to machine learning and neural networks](/experiments/machine-learning-visual-guide/) includes a visual explanation of transformers and self-attention.
