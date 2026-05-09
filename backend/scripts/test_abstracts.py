"""Run a batch of test abstracts through /analyze and pretty-print results.

Usage:
    python scripts/test_abstracts.py
    python scripts/test_abstracts.py --url http://127.0.0.1:8000 --only mechanical,nlp

Set BACKEND_URL env var to override the default endpoint.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import textwrap
import time
from dataclasses import dataclass

import requests

DEFAULT_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")


@dataclass
class TestCase:
    tag: str
    expected_domain_hint: str
    abstract: str


CASES: list[TestCase] = [
    TestCase(
        tag="mechanical",
        expected_domain_hint="mechanical / thermal / automotive",
        abstract=(
            "We investigate thermal management in internal combustion engines under "
            "high-load conditions. A novel cooling jacket geometry is proposed and "
            "validated through CFD simulation and engine dyno testing. Results show "
            "a 22% reduction in cylinder head temperature and a 7% improvement in "
            "thermal efficiency across the operating envelope."
        ),
    ),
    TestCase(
        tag="energy",
        expected_domain_hint="energy / renewables",
        abstract=(
            "This work proposes a hybrid solar-wind energy storage system using "
            "phase-change materials. We model thermal storage capacity, simulate "
            "conversion efficiency, and demonstrate a 31% improvement in round-trip "
            "efficiency over baseline lithium-ion configurations."
        ),
    ),
    TestCase(
        tag="cloud",
        expected_domain_hint="cloud / distributed systems",
        abstract=(
            "We present a microservices architecture for cloud-native applications, "
            "evaluating scalability under Kubernetes orchestration. Benchmarks on a "
            "10k requests/sec workload show 40% latency reduction and 99.9% uptime "
            "compared to monolithic baselines."
        ),
    ),
    TestCase(
        tag="iot",
        expected_domain_hint="iot / edge / sensor networks",
        abstract=(
            "We design a low-power LoRa-based sensor network for precision "
            "agriculture, integrating edge inference for soil moisture prediction. "
            "Field deployment over 6 months across 120 nodes shows 92% prediction "
            "accuracy at 11mW average power draw."
        ),
    ),
    TestCase(
        tag="security",
        expected_domain_hint="cybersecurity / forensics",
        abstract=(
            "We propose a deep-learning intrusion detection system using contrastive "
            "self-supervised representations of network flows. On the CICIDS-2017 "
            "and UNSW-NB15 benchmarks we achieve 99.2% detection rate with 0.3% "
            "false positives, outperforming prior CNN/LSTM baselines."
        ),
    ),
    TestCase(
        tag="robotics",
        expected_domain_hint="robotics / control / motion planning",
        abstract=(
            "This paper presents a real-time motion-planning framework for bipedal "
            "humanoid robots in cluttered environments. We combine sampling-based "
            "RRT* with whole-body model-predictive control, demonstrating stable "
            "locomotion at 1.4 m/s with 94% obstacle-avoidance success rate."
        ),
    ),
    TestCase(
        tag="nlp",
        expected_domain_hint="nlp / language models",
        abstract=(
            "We introduce a retrieval-augmented transformer for low-resource machine "
            "translation. The model jointly learns dense passage retrieval and "
            "translation, improving BLEU by 4.7 points on FLORES-200 languages with "
            "fewer than 1M parallel sentences."
        ),
    ),
    TestCase(
        tag="bioinformatics",
        expected_domain_hint="bioinformatics / genomics",
        abstract=(
            "We develop a graph neural network for protein-protein interaction "
            "prediction across 18 species. Trained on STRING and BioGRID, the "
            "model achieves AUROC 0.94 on held-out interactions and identifies "
            "37 novel candidates validated by yeast two-hybrid assay."
        ),
    ),
    TestCase(
        tag="medical-imaging",
        expected_domain_hint="medical imaging / healthcare ai",
        abstract=(
            "We propose a 3D U-Net variant with attention gates for tumor "
            "segmentation in brain MRI. Trained on BraTS-2021 with 1,251 cases, "
            "the model attains a Dice score of 0.91 on enhancing tumor regions, "
            "outperforming nnU-Net baselines by 3.2 points."
        ),
    ),
    TestCase(
        tag="materials",
        expected_domain_hint="materials science / metallurgy",
        abstract=(
            "We characterize the microstructure-property relationship in "
            "additively manufactured Ti-6Al-4V alloys. Combining EBSD analysis "
            "with tensile testing across 40 samples, we identify a process "
            "window yielding 1,150 MPa ultimate tensile strength with 12% "
            "elongation."
        ),
    ),
]


def colorize(s: str, code: str) -> str:
    if not sys.stdout.isatty():
        return s
    return f"\033[{code}m{s}\033[0m"


def green(s: str) -> str:  return colorize(s, "32")
def cyan(s: str) -> str:   return colorize(s, "36")
def yellow(s: str) -> str: return colorize(s, "33")
def red(s: str) -> str:    return colorize(s, "31")
def dim(s: str) -> str:    return colorize(s, "2")


def run_case(url: str, case: TestCase) -> dict | None:
    try:
        resp = requests.post(
            f"{url}/analyze",
            json={"abstract": case.abstract},
            timeout=60,
        )
    except requests.RequestException as e:
        print(red(f"  network error: {e}"))
        return None

    if resp.status_code != 200:
        print(red(f"  HTTP {resp.status_code}: {resp.text[:200]}"))
        return None

    body = resp.json()
    if body.get("status") != "success":
        print(red(f"  unexpected response: {json.dumps(body)[:200]}"))
        return None

    return body.get("analysis") or {}


def render(case: TestCase, analysis: dict) -> None:
    print(cyan(f"  domain    "), f"{analysis.get('domain')} / {analysis.get('subfield')}")
    print(cyan(f"  expected  "), dim(case.expected_domain_hint))
    print(cyan(f"  acceptance"), f"{analysis.get('acceptance_probability')}%")

    print(cyan("  journals  "))
    for j in (analysis.get("journals") or [])[:3]:
        meta = []
        if j.get("quartile"): meta.append(j["quartile"])
        if j.get("impact_factor"): meta.append(f"IF {j['impact_factor']}")
        if j.get("publisher"): meta.append(j["publisher"])
        meta_str = " · ".join(meta) if meta else ""
        score = j.get("match_score")
        print(f"             {green(str(score) + '%'):>14}  {j.get('name')}  {dim(meta_str)}")

    papers = analysis.get("related_papers") or []
    if papers:
        print(cyan("  papers    "))
        for p in papers[:3]:
            year = f"({p.get('year')})" if p.get("year") else ""
            cites = f"[{p.get('citation_count')} cites]" if p.get("citation_count") else ""
            title = (p.get("title") or "")[:75]
            print(f"             {dim(year + ' ' + cites):<22}  {title}")

    print()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL, help=f"backend URL (default: {DEFAULT_URL})")
    parser.add_argument("--only", help="comma-separated tags to run (default: all)")
    parser.add_argument("--delay", type=float, default=0.5, help="seconds between requests")
    args = parser.parse_args()

    selected = CASES
    if args.only:
        wanted = {t.strip() for t in args.only.split(",") if t.strip()}
        selected = [c for c in CASES if c.tag in wanted]
        if not selected:
            print(red(f"no matching tags. available: {', '.join(c.tag for c in CASES)}"))
            return 1

    try:
        h = requests.get(f"{args.url}/health", timeout=5)
        if h.status_code != 200:
            print(red(f"backend health check failed: HTTP {h.status_code}"))
            return 1
    except requests.RequestException as e:
        print(red(f"cannot reach backend at {args.url}: {e}"))
        return 1

    print(green(f"running {len(selected)} cases against {args.url}\n"))

    failures = 0
    for i, case in enumerate(selected):
        header = f"[{i+1}/{len(selected)}]  {case.tag}"
        print(yellow(header))
        print(dim(textwrap.indent(textwrap.fill(case.abstract, 90), "    ")))
        analysis = run_case(args.url, case)
        if analysis is None:
            failures += 1
            continue
        render(case, analysis)
        if i + 1 < len(selected):
            time.sleep(args.delay)

    if failures:
        print(red(f"{failures} case(s) failed"))
        return 1

    print(green("all cases completed"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
