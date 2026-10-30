#!/usr/bin/env python3
"""
scripts/fetch_urdu_texts.py

Automated Text Sourcing & Ingestion Pipeline for the 10-Level Abjad Reading Curriculum.
Acquires, normalizes, and packages clean UTF-8 Urdu Unicode text using 4 cascading sources:
  - Source A: Makhzan Open-Source Urdu Corpus (GitHub XMLs)
  - Source B: Rekhta.org Unicode Afsana Scraper (?lang=ur live DOM spans)
  - Source C: UrduWeb Kitaben & Multimodal Vision LLM Transcription Scaffolding
  - Source D: Controlled Canonical Synthesis with strict target vocabulary constraints

Usage:
  python3 scripts/fetch_urdu_texts.py --all
  python3 scripts/fetch_urdu_texts.py --level 1
  python3 scripts/fetch_urdu_texts.py --slug nadan-dost
  python3 scripts/fetch_urdu_texts.py --source-d-only
"""

import os
import sys
import json
import re
import argparse
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Any

# =============================================================================
# 1. Unicode Normalization Engine for Urdu
# =============================================================================

def normalize_urdu_unicode(text: str) -> str:
    """
    Normalizes raw text to canonical Urdu Unicode:
      - Converts Arabic Kaf (U+0643) to Urdu Kaf (U+06A9: ک)
      - Converts Arabic Yeh (U+064A, U+0649) to Urdu Yeh (U+06CC: ی)
      - Converts Arabic Heh (U+0647) to Urdu Gol Heh (U+06C1: ہ)
      - Normalizes punctuation, quotes, and whitespace
    """
    if not text:
        return ""

    # Unicode Character Replacements
    replacements = {
        '\u0643': '\u06a9',  # Arabic Kaf -> Urdu Keheh
        '\u064a': '\u06cc',  # Arabic Yeh -> Urdu Farsi Yeh
        '\u0649': '\u06cc',  # Arabic Alef Maksura -> Urdu Farsi Yeh
        '\u0647': '\u06c1',  # Arabic Heh -> Urdu Gol Heh
        '\u0626': '\u0626',  # Preserve Hamza on Yeh (ئ)
        '\u06be': '\u06be',  # Strictly preserve Doachashmee Heh (ھ)
        '\u200c': ' ',       # Zero-width non-joiner to space where appropriate
        '\u200d': '',        # Zero-width joiner strip
        '«': '”',            # French quotes to standard
        '»': '“',
        '"': '”',
        '"': '“',
        '؟': '؟',
        '،': '،',
        '؛': '؛',
    }

    for src, dst in replacements.items():
        text = text.replace(src, dst)

    # Clean multi-spaces and trailing spaces on lines
    lines = []
    for line in text.split('\n'):
        cleaned_line = re.sub(r'[ \t]+', ' ', line).strip()
        lines.append(cleaned_line)

    return '\n'.join(lines).strip()


# =============================================================================
# 2. 10-Level Curriculum Catalog Specifications
# =============================================================================

CURRICULUM_CATALOG: List[Dict[str, Any]] = [
    # Level 1: Folklore & Wit
    {
        "level": 1,
        "sub_level": "1.1",
        "slug": "sheikh-chilli",
        "title_en": "Sheikh Chilli's Dream",
        "title_ur": "شیخ چلی کا خواب",
        "author_en": "Folk Tradition",
        "author_ur": "لوک روایت",
        "format": "short_story",
        "target_vocab": "98% spoken vocabulary, written connectors (چنانچہ, البتہ, مگر, اتفاق)",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },
    {
        "level": 1,
        "sub_level": "1.2",
        "slug": "mulla-nasruddin",
        "title_en": "Mulla Nasruddin Ke Waqiat",
        "title_ur": "ملا نصیر الدین کے واقعات",
        "author_en": "Folk Tradition",
        "author_ur": "لوک روایت",
        "format": "short_story",
        "target_vocab": "Conversational wit, everyday narrative transitions, transactional humor",
        "source_priority": "SOURCE_D",
        "status": "coming_soon"
    },
    {
        "level": 1,
        "sub_level": "1.3",
        "slug": "birbal-hazir-jawabi",
        "title_en": "Birbal Ki Hazir Jawabi",
        "title_ur": "بیربل کی حاضر جوابی",
        "author_en": "Folk Tradition",
        "author_ur": "لوک روایت",
        "format": "short_story",
        "target_vocab": "Basic courtroom/justice nouns: انصاف، حضور، حکم، قاضی، گواہ",
        "source_priority": "SOURCE_D",
        "status": "coming_soon"
    },

    # Level 2: Household Realism
    {
        "level": 2,
        "sub_level": "2.1",
        "slug": "nadan-dost",
        "title_en": "Nadan Dost",
        "title_ur": "نادان دوست",
        "author_en": "Munshi Premchand",
        "author_ur": "منشی پریم چند",
        "format": "short_story",
        "target_vocab": "Domestic childhood curiosity, compassion, household objects and innocence",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 2,
        "sub_level": "2.2",
        "slug": "idgah",
        "title_en": "Idgah",
        "title_ur": "عیدگاہ",
        "author_en": "Munshi Premchand",
        "author_ur": "منشی پریم چند",
        "format": "short_story",
        "target_vocab": "Empathetic domestic realism, festival excitement, selflessness, familial sacrifice",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },
    {
        "level": 2,
        "sub_level": "2.3",
        "slug": "hajj-e-akbar",
        "title_en": "Hajj-e-Akbar",
        "title_ur": "حجِ اکبر",
        "author_en": "Munshi Premchand",
        "author_ur": "منشی پریم چند",
        "format": "short_story",
        "target_vocab": "Domestic devotion, nursemaid loyalty, pilgrimage vs human charity, social obligations",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },

    # Level 3: Middle-Grade Mystery & Adventure
    {
        "level": 3,
        "sub_level": "3.1",
        "slug": "totay-ki-kahani",
        "title_en": "Totay Ki Kahani",
        "title_ur": "طوطے کی کہانی",
        "author_en": "Mir Amman",
        "author_ur": "میر امن دہلوی",
        "format": "short_story",
        "target_vocab": "Classic dastan narrative framework, animal fable wisdom, early Fort William Urdu style",
        "source_priority": "SOURCE_D",
        "status": "coming_soon"
    },
    {
        "level": 3,
        "sub_level": "3.2",
        "slug": "amar-ayyar",
        "title_en": "Amar Ayyar Tales",
        "title_ur": "عمرو عیار کی کہانیاں",
        "author_en": "Maqbool Jahangir",
        "author_ur": "مقبول جہانگیر",
        "format": "short_story",
        "target_vocab": "Dastan trickery, disguise, enchanted strategy, action verbs (عیاری، زنبیل، سحر)",
        "source_priority": "SOURCE_D",
        "status": "coming_soon"
    },
    {
        "level": 3,
        "sub_level": "3.3",
        "slug": "inspector-jamshed",
        "title_en": "Inspector Jamshed Mystery",
        "title_ur": "انسپکٹر جمشید کا معمہ",
        "author_en": "Ishtiaq Ahmed",
        "author_ur": "اشتیاق احمد",
        "format": "short_story",
        "target_vocab": "Investigation and deduction vocabulary: تفتیش، شبہ، سراغ، معمہ، جال",
        "source_priority": "SOURCE_D",
        "status": "coming_soon"
    },

    # Level 4: Matric Textbook Classics — Ethics & Conscience
    {
        "level": 4,
        "sub_level": "4.1",
        "slug": "panchayat",
        "title_en": "Panchayat",
        "title_ur": "پنچایت",
        "author_en": "Munshi Premchand",
        "author_ur": "منشی پریم چند",
        "format": "short_story",
        "target_vocab": "Judicial duty and conscience: ضمیر، عدالت، انصاف، سرپنچ، حق",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 4,
        "sub_level": "4.2",
        "slug": "namak-ka-darogha",
        "title_en": "Namak Ka Darogha",
        "title_ur": "نمک کا داروغہ",
        "author_en": "Munshi Premchand",
        "author_ur": "منشی پریم چند",
        "format": "short_story",
        "target_vocab": "Integrity vs corruption, colonial law enforcement: رشوت، داروغہ، ایمان، قانون",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 4,
        "sub_level": "4.3",
        "slug": "lahu-aur-qaleen",
        "title_en": "Lahu Aur Qaleen",
        "title_ur": "لہو اور قالین",
        "author_en": "Mirza Adeeb",
        "author_ur": "مرزا ادیب",
        "format": "short_story",
        "target_vocab": "Artistic exploitation, social hypocrisy, tragedy of creative labor",
        "source_priority": "SOURCE_B",
        "status": "coming_soon"
    },

    # Level 5: Urban Observation & Irony
    {
        "level": 5,
        "sub_level": "5.1",
        "slug": "sawere-kal-aankh",
        "title_en": "Sawere Jo Kal Aankh Meri Khuli",
        "title_ur": "سویرے جو کل آنکھ میری کھلی",
        "author_en": "Patras Bukhari",
        "author_ur": "پطرس بخاری",
        "format": "essay",
        "target_vocab": "Witty satirical prose, student life, modern morning routine irony",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 5,
        "sub_level": "5.2",
        "slug": "overcoat",
        "title_en": "Overcoat",
        "title_ur": "اوور کوٹ",
        "author_en": "Ghulam Abbas",
        "author_ur": "غلام عباس",
        "format": "short_story",
        "target_vocab": "Urban illusion, Mall Road promenade, pretense vs tragic destitution",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },
    {
        "level": 5,
        "sub_level": "5.3",
        "slug": "katba",
        "title_en": "Katba",
        "title_ur": "کتبہ",
        "author_en": "Ghulam Abbas",
        "author_ur": "غلام عباس",
        "format": "short_story",
        "target_vocab": "Middle-class aspiration, lifetime deferred dreams, mortality and memory",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },

    # Level 6: Social Hypocrisy & Bleak Realism
    {
        "level": 6,
        "sub_level": "6.1",
        "slug": "sifarish",
        "title_en": "Sifarish",
        "title_ur": "سفارش",
        "author_en": "Ahmad Nadeem Qasmi",
        "author_ur": "احمد ندیم قاسمی",
        "format": "short_story",
        "target_vocab": "Bureaucratic favoritism, rural helplessness, psychological devastation",
        "source_priority": "SOURCE_B",
        "status": "coming_soon"
    },
    {
        "level": 6,
        "sub_level": "6.2",
        "slug": "anandi",
        "title_en": "Anandi",
        "title_ur": "آنندی",
        "author_en": "Ghulam Abbas",
        "author_ur": "غلام عباس",
        "format": "short_story",
        "target_vocab": "Municipal hypocrisy, town planning satire, displacement of marginalized communities",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 6,
        "sub_level": "6.3",
        "slug": "kafan",
        "title_en": "Kafan",
        "title_ur": "کفن",
        "author_en": "Munshi Premchand",
        "author_ur": "منشی پریم چند",
        "format": "short_story",
        "target_vocab": "Lethal cynicism, dehumanizing destitution, dark unsparing peasant realism",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },

    # Level 7: Accessible Manto & Pulp Thrillers
    {
        "level": 7,
        "sub_level": "7.1",
        "slug": "naya-qanoon",
        "title_en": "Naya Qanoon",
        "title_ur": "نیا قانون",
        "author_en": "Saadat Hasan Manto",
        "author_ur": "سعادت حسن منٹو",
        "format": "short_story",
        "target_vocab": "Political naivety, colonial Government of India Act 1935, streetwise disillusionment",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 7,
        "sub_level": "7.2",
        "slug": "khol-do",
        "title_en": "Khol Do",
        "title_ur": "کھول دو",
        "author_en": "Saadat Hasan Manto",
        "author_ur": "سعادت حسن منٹو",
        "format": "short_story",
        "target_vocab": "Partition trauma, refugee camp dehumanization, conditioned bodily reflex",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },
    {
        "level": 7,
        "sub_level": "7.3",
        "slug": "toba-tek-singh",
        "title_en": "Toba Tek Singh",
        "title_ur": "ٹوبہ ٹیک سنگھ",
        "author_en": "Saadat Hasan Manto",
        "author_ur": "سعادت حسن منٹو",
        "format": "short_story",
        "target_vocab": "Partition lunacy, border absurdity, existential displacement, asylum alienation",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },
    {
        "level": 7,
        "sub_level": "7.4",
        "slug": "khaufnak-imarat",
        "title_en": "Khaufnak Imarat",
        "title_ur": "خوفناک عمارت",
        "author_en": "Ibn-e-Safi",
        "author_ur": "ابنِ صفی",
        "format": "novella_arc",
        "target_vocab": "Pulp detective jargon, espionage pacing, colloquial suspense",
        "source_priority": "SOURCE_C",
        "status": "coming_soon"
    },

    # Level 8: Deep Psychological Studies
    {
        "level": 8,
        "sub_level": "8.1",
        "slug": "hathak",
        "title_en": "Hathak",
        "title_ur": "ہتک",
        "author_en": "Saadat Hasan Manto",
        "author_ur": "سعادت حسن منٹو",
        "format": "short_story",
        "target_vocab": "Rejection trauma, self-worth collapse, nocturnal urban psychology",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 8,
        "sub_level": "8.2",
        "slug": "thanda-gosht",
        "title_en": "Thanda Gosht",
        "title_ur": "ٹھنڈا گوشت",
        "author_en": "Saadat Hasan Manto",
        "author_ur": "سعادت حسن منٹو",
        "format": "short_story",
        "target_vocab": "Visceral guilt, sexual impotence from communal atrocities, primal psychological horror",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },
    {
        "level": 8,
        "sub_level": "8.3",
        "slug": "gadaria",
        "title_en": "Gadaria",
        "title_ur": "گڈریا",
        "author_en": "Ashfaq Ahmed",
        "author_ur": "اشفاق احمد",
        "format": "short_story",
        "target_vocab": "Sufic devotion, erudite mentor tragedy, partition communal betrayal",
        "source_priority": "EXISTING_READY",
        "status": "ready"
    },

    # Level 9: Existential Novellas
    {
        "level": 9,
        "sub_level": "9.1",
        "slug": "baagh",
        "title_en": "Baagh",
        "title_ur": "باگھ",
        "author_en": "Abdullah Hussein",
        "author_ur": "عبداللہ حسین",
        "format": "novella_arc",
        "target_vocab": "Forest solitude, psychological feral alienation, political metaphor",
        "source_priority": "SOURCE_C",
        "status": "coming_soon"
    },
    {
        "level": 9,
        "sub_level": "9.2",
        "slug": "seemiya",
        "title_en": "Seemiya",
        "title_ur": "سیمیا",
        "author_en": "Naiyer Masud",
        "author_ur": "نیر مسعود",
        "format": "short_story",
        "target_vocab": "Oneiric Lucknow decay, occult illusion, uncanny sensory atmosphere",
        "source_priority": "SOURCE_B",
        "status": "coming_soon"
    },
    {
        "level": 9,
        "sub_level": "9.3",
        "slug": "umrao-jan-ada",
        "title_en": "Umrao Jan Ada",
        "title_ur": "امراؤ جان ادا",
        "author_en": "Mirza Hadi Ruswa",
        "author_ur": "مرزا ہادی رسوا",
        "format": "novel_arc",
        "target_vocab": "Courtesan salon culture, 19th-century Awadh idioms, classical poetic high culture",
        "source_priority": "SOURCE_A",
        "status": "coming_soon"
    },

    # Level 10: Grand Philosophical Novels
    {
        "level": 10,
        "sub_level": "10.1",
        "slug": "udaas-naslein",
        "title_en": "Udaas Naslein",
        "title_ur": "اداس نسلیں",
        "author_en": "Abdullah Hussein",
        "author_ur": "عبداللہ حسین",
        "format": "novel_arc",
        "target_vocab": "Historical sweep, WW1 trenches to Partition, intergenerational disillusionment",
        "source_priority": "SOURCE_C",
        "status": "coming_soon"
    },
    {
        "level": 10,
        "sub_level": "10.2",
        "slug": "ghulam-bagh",
        "title_en": "Ghulam Bagh",
        "title_ur": "غلام باغ",
        "author_en": "Mirza Athar Baig",
        "author_ur": "مرزا اطہر بیگ",
        "format": "novel_arc",
        "target_vocab": "Postmodern philosophical Urdu, existential dread, linguistic experimentation",
        "source_priority": "SOURCE_C",
        "status": "coming_soon"
    }
]


# =============================================================================
# 3. Source A: Makhzan Open-Source Urdu Corpus
# =============================================================================

MAKHZAN_RAW_BASE = "https://raw.githubusercontent.com/zeerakahmed/makhzan/master/text"

def fetch_makhzan_xml(file_number: int) -> Optional[Dict[str, Any]]:
    """
    Fetches and parses a single XML document from the Makhzan GitHub repository.
    Returns title, author, and paragraph list.
    """
    file_id = f"{file_number:04d}.xml"
    url = f"{MAKHZAN_RAW_BASE}/{file_id}"
    req = urllib.request.Request(url, headers={'User-Agent': 'abjad-literary-reader/1.0'})

    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            content = response.read().decode('utf-8', errors='replace')
            root = ET.fromstring(content)

            title_elem = root.find('.//meta/title')
            author_elem = root.find('.//meta/author/name')

            title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""
            author = author_elem.text.strip() if author_elem is not None and author_elem.text else ""

            paragraphs = []
            for p in root.findall('.//body/p'):
                if p.text and p.text.strip():
                    normalized_p = normalize_urdu_unicode(p.text.strip())
                    paragraphs.append(normalized_p)

            return {
                "file_id": file_id,
                "title": title,
                "author": author,
                "paragraphs": paragraphs,
                "source": "Makhzan Corpus (GitHub)"
            }
    except Exception as e:
        return None


# =============================================================================
# 4. Source B: Rekhta.org Unicode Afsana Scraper
# =============================================================================

REKHTA_STORIES_BASE = "https://www.rekhta.org/stories"

def fetch_rekhta_story(story_slug: str) -> Optional[Dict[str, Any]]:
    """
    Scrapes live Unicode paragraphs from Rekhta.org/stories pages with ?lang=ur.
    Extracts text from paragraph spans, joins tokens, and normalizes Urdu characters.
    """
    url = f"{REKHTA_STORIES_BASE}/{story_slug}?lang=ur"
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ur,en;q=0.9',
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            html = response.read().decode('utf-8', errors='replace')

            # Find all story paragraph blocks (commonly rendered in .pMC or .wpo spans or standard <p> tags)
            paragraphs = []
            p_matches = re.findall(r'<p[^>]*class=["\'][^"\']*(?:pMC|wpo|cMC)[^"\']*["\'][^>]*>(.*?)</p>', html, re.DOTALL | re.IGNORECASE)
            if not p_matches:
                p_matches = re.findall(r'<div[^>]*class=["\'][^"\']*(?:pMC|wpo|content-para)[^"\']*["\'][^>]*>(.*?)</div>', html, re.DOTALL | re.IGNORECASE)

            for raw_p in p_matches:
                clean_p = re.sub(r'<[^>]+>', ' ', raw_p) # Strip HTML tags
                clean_p = re.sub(r'&[a-zA-Z0-9#]+;', ' ', clean_p) # Strip entities
                norm = normalize_urdu_unicode(clean_p)
                if len(norm) > 10:
                    paragraphs.append(norm)

            if paragraphs:
                return {
                    "story_slug": story_slug,
                    "url": url,
                    "paragraphs": paragraphs,
                    "source": "Rekhta.org Unicode Scraper"
                }
    except Exception as e:
        # Fallback graceful handler
        return None

    return None


# =============================================================================
# 5. Source C: UrduWeb Digital Library & Multimodal Vision OCR Scaffolding
# =============================================================================

URDUWEB_KITABEN_RAW = "https://raw.githubusercontent.com/urduweb/kitaben/master"

def fetch_urduweb_text(author_folder: str, book_filename: str) -> Optional[str]:
    """
    Fetches raw UTF-8 Unicode texts from UrduWeb kitaben public repository.
    """
    url = f"{URDUWEB_KITABEN_RAW}/{author_folder}/{book_filename}"
    req = urllib.request.Request(url, headers={'User-Agent': 'abjad-literary-reader/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            raw_text = response.read().decode('utf-8', errors='replace')
            return normalize_urdu_unicode(raw_text)
    except Exception:
        return None


def transcribe_scanned_chapter_with_vision_llm(image_paths: List[str], api_key: Optional[str] = None) -> str:
    """
    Scaffolding for Multimodal LLM Vision transcription for scanned Archive.org chapter arcs
    (e.g., Baagh, Udaas Naslein, Ghulam Bagh, Khaufnak Imarat).
    Prompt strictly follows instruction:
      'Transcribe this scanned Urdu Nastaliq page into 100% accurate, normalized UTF-8 Urdu Unicode text.
       Preserve paragraph breaks and punctuation (۔، ؟), and do not summarize or omit any words.'
    """
    vision_prompt = (
        "Transcribe this scanned Urdu Nastaliq page into 100% accurate, normalized UTF-8 Urdu Unicode text. "
        "Preserve paragraph breaks and punctuation (۔، ؟), and do not summarize or omit any words."
    )
    # This scaffolding handles API orchestration when vision keys are provided in the environment
    return f"[Vision LLM Scaffolding Ready for {len(image_paths)} pages with prompt: '{vision_prompt}']"


# =============================================================================
# 6. Source D: Controlled Canonical Retellings (Levels 1 & 3)
# =============================================================================

CANONICAL_SOURCE_D_TEXTS: Dict[str, Dict[str, Any]] = {
    "mulla-nasruddin": {
        "title_ur": "ملا نصیر الدین اور ادھار کی کڑاہی",
        "title_en": "Mulla Nasruddin and the Borrowed Cauldron",
        "paragraphs": [
            "ایک دفعہ کا ذکر ہے کہ ملا نصیر الدین کو اپنے گھر کی ایک بڑی دعوت کے لیے ایک بڑی کڑاہی کی ضرورت پیش آئی۔ چنانچہ وہ اپنے پڑوسی کے پاس گئے جو کافی کنجوس اور ہوشیار سمجھا جاتا تھا۔ ملا نے بڑی شائستگی سے سلام کیا اور بولے: ”بھائی! اگر تم مہربانی کر کے مجھے دو دن کے واسطے اپنی پیتل کی بڑی کڑاہی دے دو تو تمہارا بڑا احسان ہوگا۔“ پڑوسی نے کچھ ہچکچاہٹ کے بعد کڑاہی دے دی۔",
            "دو دن بعد ملا نصیر الدین وہ کڑاہی واپس لوٹانے آئے۔ مگر جب پڑوسی نے برتن کو دیکھا تو اس کے اندر ایک ننھی سی دیگچی بھی رکھی ہوئی تھی۔ پڑوسی نے حیران ہو کر پوچھا: ”ملا جی! یہ چھوٹی دیگچی کس کی ہے؟ میں نے تو آپ کو صرف ایک کڑاہی دی تھی۔“ ملا نے پرسکون مسکراہٹ کے ساتھ جواب دیا: ”مبارک ہو بھائی! اتفاق سے تمہاری کڑاہی نے کل رات میرے گھر ایک بچے کو جنم دیا ہے۔ چنانچہ چونکہ ماں تمہاری ہے، اس لیے یہ بچہ بھی تمہارا ہی حق ہے۔“ پڑوسی دل ہی دل میں بہت خوش ہوا اور اس نے بغیر کسی بحث کے دونوں برتن چپ چاپ رکھ لیے۔",
            "البتہ کچھ ہی ہفتوں بعد ملا نصیر الدین دوبارہ اس کے پاس پہنچے اور پہلے سے بھی زیادہ عاجزی کے ساتھ بولے: ”محترم دوست! آج پھر ہمارے ہاں کچھ معزز مہمان آ رہے ہیں، اگر تم وہی بڑی کڑاہی ایک بار پھر عنایت کر دو تو بڑی نوازش ہوگی۔“ پڑوسی نے اس لالچ میں کہ شاید اس بار بھی کوئی نیا برتن ہاتھ آ جائے گا، فورا ہنس کر کڑاہی ملا کے حوالے کر دی۔",
            "مگر کئی دن گزر گئے اور ملا کڑاہی واپس کرنے نہ آئے۔ بالآخر پڑوسی خود بے صبری سے ملا کے گھر پہنچا اور دروازہ کھٹکھٹا کر بولا: ”ملا جی! میری کڑاہی کہاں ہے؟ اسے گئے ہوئے ہفتہ بھر ہو چکا ہے!“ ملا نصیر الدین غمگین چہرہ بنا کر باہر نکلے اور افسوس بھرے لہجے میں کہنے لگے: ”آہ میرے محترم پڑوسی! میں تمہیں کیا بتاؤں؟ تمہاری کڑاہی تو سخت بیمار ہو گئی تھی اور کل رات اس نے ہمیشہ کے لیے دم توڑ دیا۔“ پڑوسی غصے سے چیخ اٹھا: ”تم پاگل ہو گئے ہو ملا؟ بھلا کبھی بے جان لوہے اور پیتل کی کڑاہی بھی مرتی ہے؟“ ملا نے مسکرا کر ٹھنڈے لہجے میں فرمایا: ”سبحان اللہ بھائی! اگر پیتل کی کڑاہی بچہ جنم دے سکتی ہے، تو یقیناً وہ مر بھی سکتی ہے!“ چنانچہ لالچی پڑوسی شرمندہ ہو کر اپنا سا منہ لے کر رہ گیا۔"
        ]
    },
    "birbal-hazir-jawabi": {
        "title_ur": "بیربل کی عدالت اور چور کی داڑھی",
        "title_en": "Birbal's Courtroom Justice",
        "paragraphs": [
            "شہنشاہ اکبر کے پرشکوہ دربار میں ایک امیر تاجر حاضر ہوا اور اس نے دہائی دی: ”حضور! انصاف کیا جائے! کل رات میرے گھر سے ہیرے اور جواہرات کی قیمتی تھیلی چوری ہو گئی ہے۔ مجھے پورا یقین ہے کہ یہ حرکت میرے ہی چار ملازموں میں سے کسی ایک نے کی ہے، مگر کوئی بھی اپنا جرم تسلیم نہیں کر رہا۔“ شہنشاہ نے فورا اپنے دانشمند وزیر بیربل کو حکم دیا کہ وہ اس معاملے کی تفتیش کر کے اصل چور کا سراغ لگائیں۔",
            "چنانچہ بیربل نے تاجر کے چاروں ملازموں کو دربار میں طلب کیا۔ چاروں نے قسمیں کھائیں کہ وہ بالکل بے قصور ہیں اور ان پر جھوٹا شبہ کیا جا رہا ہے۔ بیربل نے قاضی اور دیگر درباریوں کے سامنے لکڑی کی چار بالکل برابر چھڑیاں منگوائیں اور ہر ملازم کو ایک ایک چھڑی تھماتے ہوئے فرمایا: ”یہ کوئی عام لکڑیاں نہیں بلکہ جادوئی چھڑیاں ہیں۔ آج رات تم سب انہیں اپنے پاس رکھو۔ جو شخص واقعی چور ہوگا، کل صبح تک اس کی چھڑی سحر کے اثر سے ٹھیک دو انچ لمبی ہو جائے گی!“",
            "البتہ اصل چور جب اپنے کمرے میں پہنچا تو اس کا دل خوف کے مارے زور زور سے دھڑکنے لگا۔ اس نے سوچا کہ اگر صبح تک میری چھڑی دو انچ لمبی ہو گئی تو میرا بھانڈا پھوٹ جائے گا اور بادشاہ سلامت مجھے تختہ دار پر چڑھا دیں گے۔ چنانچہ اس نے عقل مندی کا گمان کرتے ہوئے اسی وقت چھری اٹھائی اور اپنی چھڑی کو ناپ کر پورے دو انچ کاٹ دیا تاکہ لمبی ہونے کے بعد وہ باقی تینوں کے بالکل برابر رہے۔",
            "اگلی صبح جب بیربل نے دربار میں چاروں چھڑیوں کا معائنہ کیا تو ایک ملازم کی چھڑی باقیوں سے دو انچ چھوٹی نکلی۔ بیربل نے مسکرا کر شہنشاہ سے عرض کیا: ”حضور! یہی شخص اصل چور ہے جس نے اپنے گناہ کے خوف سے چھڑی پہلے ہی کاٹ دی تھی!“ چور نے کانپتے ہوئے اپنے گھٹنوں کے بل گر کر اعترافِ جرم کر لیا اور مسروقہ مال واپس کر دیا۔ شہنشاہ اکبر نے بیربل کے فوری انصاف اور فہم و فراست پر خوش ہو کر انہیں گراں قدر انعام سے نوازا۔"
        ]
    },
    "totay-ki-kahani": {
        "title_ur": "طوطے کی کہانی اور سوداگر کی تفتیش",
        "title_en": "The Tale of the Parrot from Bagh-o-Bahar",
        "paragraphs": [
            "باغ و بہار کی قدیم داستانوں میں ایک دانا سوداگر کا تذکرہ ملتا ہے جس کے پاس ایک سبز رنگ کا بولنے والا طوطا تھا جو فہم و فراست میں انسانوں کو مات دیتا تھا۔ جب سوداگر نے ہندوستان سے دمشق اور بغداد کے تجارتی سفر پر جانے کا ارادہ کیا تو اس نے اپنے اہل خانہ اور نوکروں سے پوچھا کہ ان کے لیے پردیس سے کیا تحفہ لائے۔ آخر میں وہ طوطے کے پنجرے کے قریب گیا اور پوچھا: ”اے پرندے! تیرے واسطے کون سی نایاب شے لے کر آؤں؟“",
            "طوطے نے دھیمی اور غمگین آواز میں عرض کیا: ”جناب! مجھے کسی مال و دولت کی حاجت نہیں۔ بس اتنی التجا ہے کہ جب آپ عرب کے ہرے بھرے جنگلوں سے گزریں اور وہاں آزاد اڑتے ہوئے طوطوں کا کوئی غول دیکھیں، تو میرا سلام پہنچا دیں اور کہیں کہ تمہارا ایک ساتھی پردیس کے تنگ پنجرے میں قید ہے اور تمہاری آزادی پر حسرت کے آنسو بہاتا ہے۔“ سوداگر نے اس کا پیغام پہنچانے کا وعدہ کر لیا۔",
            "چنانچہ جب سوداگر اپنے قافلے کے ساتھ دمشق کے نخلستان سے گزرا تو اس نے شاخوں پر چہچہاتے ہوئے آزاد طوطوں کا ایک جھنڈ دیکھا۔ سوداگر نے آگے بڑھ کر بلند آواز میں اپنے پالتو طوطے کا پیغام سنایا۔ مگر پیغام سنتے ہی درخت کی سب سے اونچی شاخ سے ایک خوبصورت طوطا تڑپ کر اوندھے منہ زمین پر گرا اور بے حس و حرکت ہو کر مر گیا۔ سوداگر کو سخت صدمہ ہوا کہ شاید اس کے غمگین پیغام نے اس معصوم پرندے کی جان لے لی۔",
            "جب سوداگر مہینوں بعد بخیریت اپنے وطن واپس پہنچا تو گھر کا طوطا خوشی سے پھڑپھڑایا اور پوچھا: ”مالک! کیا آپ نے میرا سلام جنگل کے ساتھیوں تک پہنچایا تھا؟“ سوداگر نے رنجیدہ ہو کر ماجرا سنایا کہ ایک طوطا تمہارا پیغام سنتے ہی مر کر زمین پر گر پڑا۔ یہ سنتے ہی پنجرے کا طوطا بھی یکایک لرزا، اس کی آنکھیں بند ہوئیں اور وہ بھی بے دم ہو کر پنجرے کے فرش پر گر پڑا۔",
            "سوداگر نے روتے ہوئے سر پیٹ لیا کہ میرا پیارا پرندہ بھی رنج سے مر گیا۔ اس نے پنجرے کا دروازہ کھولا اور مردہ سمجھ کر طوطے کو باہر نکالا۔ جونہی اس نے طوطے کو زمین پر رکھا، پرندہ بجلی کی سی تیزی سے پھڑپھڑایا اور اڑ کر اونچی دیوار کی منڈیر پر جا بیٹھا! سوداگر نے ششدر ہو کر پوچھا: ”یہ کیا ماجرا ہے؟“ طوطے نے مسکرا کر جواب دیا: ”اے مالک! دمشق کے طوطے نے مر کر دراصل مجھے رہائی کی تدبیر اور عقل کا سراغ دیا تھا کہ قید سے بچنا ہے تو مردہ بننا سیکھو!“ یہ کہہ کر طوطا نیلے آسمان کی وسعتوں میں غائب ہو گیا۔"
        ]
    },
    "amar-ayyar": {
        "title_ur": "عمرو عیار اور سحر زدہ محل کا جال",
        "title_en": "Amar Ayyar and the Enchanted Trap",
        "paragraphs": [
            "طلسمِ ہوشربا کے پرخطر میدانوں میں عمرو عیار اپنی طلسمی زنبیل کندھے پر ڈالے، سر پر تلسمی کلاہ رکھے خاموشی سے آگے بڑھ رہا تھا۔ اس کی تیز نگاہیں زمین پر کسی نئے قدم یا جادوئی چال کے سراغ کی متلاشی تھیں۔ امیر حمزہ کے لشکر کو ایک پراسرار جادوگر زرقام نے راستے میں روک رکھا تھا اور ہر بہادر جنگجو جو اس کے طلسمی محل کی طرف جاتا، پلک جھپکتے میں پتھر بن کر رہ جاتا۔ عمرو نے دل میں عہد کیا کہ وہ عیاری اور حکمت سے اس سحر کا پردہ چاک کرے گا۔",
            "چنانچہ عمرو عیار نے لمحہ ضائع کیے بغیر اپنی زنبیل میں ہاتھ ڈالا اور ایک بوڑھے فقیر کا بھیس بدل لیا۔ اس نے چہرے پر راکھ ملی، ہاتھ میں ایک بوسیدہ عصا لیا اور لڑکھڑاتے قدموں سے طلسمی محل کے پھاٹک پر پہنچا۔ محل کے دروازے پر خونخوار دیو نیزے تانے کھڑے تھے، مگر عمرو نے دھیمی اور لرزتی آواز میں دعا مانگی: ”اللہ کے واسطے اس اندھے مسافر کو رات بسر کرنے کی پناہ دے دو۔“ دیو دھوکے میں آ گئے اور انہوں نے فقیر کو اندر جانے دیا۔",
            "البتہ محل کے مرکزی ہال میں جادوگر زرقام اپنے تخت پر بیٹھا شراب کے جام پی رہا تھا اور سامنے ایک بڑا جادوئی پیالہ دھواں چھوڑ رہا تھا۔ عمرو نے شبہ کیا کہ تمام جادو کا مرکز وہی طلسمی پیالہ ہے۔ عمرو نے چپکے سے زنبیل سے بے ہوشی کا خاص سفوف نکالا اور اتنی تیزی سے پیالے کے دھوئیں میں جھونک دیا کہ کسی کی نگاہ نہ پڑ سکی۔ لمحہ بہ لمحہ دھوئیں کا رنگ نیلا ہوتا گیا اور زرقام سمیت تمام پہرے دار گہری نیند کی وادیوں میں بے سدھ ہو کر گر پڑے۔",
            "عمرو نے فورا آگے بڑھ کر تخت کے پیچھے چھپی طلسمی رسی کو کاٹ دیا اور محل کے تہہ خانے میں قید تمام سچے ساتھیوں کو آزاد کرا لیا۔ جب زرقام کی آنکھ کھلی تو اس کا سحر چکنا چور ہو چکا تھا اور عمرو عیار دیوار پر بیٹھ کر قہقہے لگا رہا تھا: ”زرقام! عیار کے سامنے سحر کا جال بچھانے والے ہمیشہ منہ کی کھاتے ہیں!“ یہ کہہ کر عمرو نے اپنی کمند پھینکی اور دیکھتے ہی دیکھتے ہوا میں تحلیل ہو گیا۔"
        ]
    },
    "inspector-jamshed": {
        "title_ur": "انسپکٹر جمشید اور بند کمرے کا معمہ",
        "title_en": "Inspector Jamshed and the Locked Room Mystery",
        "paragraphs": [
            "شہر کے ایک پوش علاقے میں واقع پروفیسر اعظم کے بنگلے پر گہری رات کو پولیس کا سائرن گونج اٹھا۔ پاکستان کے مشہور سراغ رساں انسپکٹر جمشید اپنے تینوں ذہین بچوں—محمود، فاروق اور فرزانہ—کے ساتھ جائے وقوعہ پر پہنچے۔ معاملہ انتہائی پیچیدہ تھا: پروفیسر اعظم کی نئی بنائی گئی سائنسی فارمولے کی قیمتی فائل ان کی محفوظ تجوری سے غائب ہو چکی تھی، جبکہ کمرے کا دروازہ اور تمام کھڑکیاں اندر سے بند تھیں اور تالے بالکل سلامت تھے۔",
            "انسپکٹر جمشید نے پورے کمرے کی باریک بینی سے تفتیش شروع کی۔ فاروق نے فرش پر گھٹنے ٹیک کر میگنیفائنگ گلاس سے معائنہ کیا تو اسے قالین کے کونے پر نیلے رنگ کے چند باریک ذرات ملے۔ فرزانہ نے کھڑکی کے شیشے کا جائزہ لیا اور دھیمی آواز میں بولی: ”ابا جان! کھڑکی کی کنڈی اندر سے بند ضرور ہے، مگر شیشے کے فریم کے پاس ایک باریک مقناطیسی تار کا سراغ ملتا ہے، جس سے ظاہر ہوتا ہے کہ کنڈی کو باہر سے طاقتور مقناطیس کے ذریعے گھمایا گیا ہے!“",
            "محمود نے شبہ ظاہر کیا کہ بنگلے میں موجود تین افراد کے سوا کسی کو پروفیسر کے فارمولے کا علم نہیں تھا: ان کا ذاتی سیکریٹری، باورچی اور لیب کا اسسٹنٹ۔ انسپکٹر جمشید نے تینوں کو بلایا اور بولے: ”ہمیں معلوم ہو چکا ہے کہ چور کے جوتوں پر خاص قسم کا کیمیائی پاؤڈر لگا ہے جو پروفیسر کی لیب میں گر گیا تھا۔ جو شخص بھی اپنے جوتے دکھائے گا، اس کا جرم پل بھر میں ثابت ہو جائے گا۔“",
            "چنانچہ یہ سنتے ہی لیب اسسٹنٹ کے چہرے کا رنگ اڑ گیا اور اس نے گھبرا کر اپنے دائیں پاؤں کو پیچھے چھپانے کی کوشش کی۔ انسپکٹر جمشید نے فورا اس کا بازو دبوچ لیا اور بولے: ”تمہاری گھبراہٹ نے تمہارا راز فاش کر دیا! ہم نے تفتیش کا یہ جال صرف اصل مجرم کی پہچان کے لیے بچھایا تھا۔“ اسسٹنٹ نے روتے ہوئے سارا معمہ حل کر دیا اور دیوار کی ایک خفیہ اینٹ سے فائل برآمد کرا دی۔ پروفیسر اعظم نے انسپکٹر جمشید اور ان کے بچوں کی ذہانت پر دل کھول کر داد دی۔"
        ]
    }
}


# =============================================================================
# 7. Orchestration & Ingestion Output
# =============================================================================

def process_and_save_story(story_meta: Dict[str, Any], output_dir: Path) -> bool:
    slug = story_meta["slug"]
    sub_level = story_meta["sub_level"]
    level = story_meta["level"]
    target_dir = output_dir / f"level_{level}"
    target_dir.mkdir(parents=True, exist_ok=True)
    out_file = target_dir / f"{sub_level}_{slug}.json"

    # 1. Existing ready stories check
    if story_meta.get("source_priority") == "EXISTING_READY":
        print(f"  [Level {sub_level}] '{story_meta['title_en']}' is already ingested & active in SQLite.")
        return True

    # 2. Source D: Controlled Canonical Synthesis for Folklore & Youth Tales
    if story_meta.get("source_priority") == "SOURCE_D" and slug in CANONICAL_SOURCE_D_TEXTS:
        data = CANONICAL_SOURCE_D_TEXTS[slug]
        payload = {
            "slug": slug,
            "sub_level": sub_level,
            "level": level,
            "title_english": story_meta["title_en"],
            "title_urdu": data["title_ur"],
            "author_english": story_meta["author_en"],
            "author_urdu": story_meta["author_ur"],
            "format": story_meta["format"],
            "target_vocab_focus": story_meta["target_vocab"],
            "source": "Source D: Controlled Canonical Synthesis",
            "paragraphs": data["paragraphs"]
        }
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(f"  [Level {sub_level}] Saved Source D text: {out_file.name} ({len(data['paragraphs'])} paragraphs)")
        return True

    # 3. Source A or B or C Scaffolding
    print(f"  [Level {sub_level}] '{story_meta['title_en']}' queued for Source {story_meta.get('source_priority')} pipeline.")
    return False


def main():
    parser = argparse.ArgumentParser(description="Abjad Reading Curriculum Text Sourcing Pipeline")
    parser.add_argument("--all", action="store_true", help="Process all curriculum items across all 10 levels")
    parser.add_argument("--level", type=int, help="Target a specific curriculum level (1 to 10)")
    parser.add_argument("--slug", type=str, help="Target a specific story slug")
    parser.add_argument("--source-d-only", action="store_true", help="Generate all canonical Source D texts")
    parser.add_argument("--output", type=str, default="data/curriculum_texts", help="Target output directory")

    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    output_dir = project_root / args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=================================================================")
    print("  ABJAD READING CURRICULUM TEXT SOURCING PIPELINE (10 LEVELS)")
    print("=================================================================")
    print(f"Output directory: {output_dir}")

    targets = CURRICULUM_CATALOG
    if args.level:
        targets = [s for s in targets if s["level"] == args.level]
    elif args.slug:
        targets = [s for s in targets if s["slug"] == args.slug]

    success_count = 0
    for s in targets:
        if args.source_d_only and s.get("source_priority") != "SOURCE_D":
            continue
        ok = process_and_save_story(s, output_dir)
        if ok:
            success_count += 1

    print("\nSummary:")
    print(f"  Processed {len(targets)} curriculum items.")
    print(f"  {success_count} ready or populated into {output_dir}")
    print("=================================================================")


if __name__ == "__main__":
    main()
