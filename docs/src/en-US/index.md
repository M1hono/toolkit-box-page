---
layout: home
title: "M1hono Toolkit Box"
description: "Toolkit Box written by M1hono."
cssVars:
    --vp-font-family-base: '"IBM Plex Sans", "Segoe UI Variable Text", "Helvetica Neue", Arial, sans-serif'
    --vp-font-family-mono: '"IBM Plex Mono", "SFMono-Regular", "Cascadia Mono", monospace'
    --vp-c-brand-1:
        light: "#b86738"
        dark: "#efbd95"
    --vp-c-brand-2:
        light: "#c97a4f"
        dark: "#f5cfaf"
    --vp-c-brand-3:
        light: "#dfae8c"
        dark: "#fae2cb"
    --vp-c-brand-soft:
        light: "rgba(184, 103, 56, 0.12)"
        dark: "rgba(239, 189, 149, 0.18)"
    --vp-c-bg:
        light: "#f7f2eb"
        dark: "#0d1117"
    --vp-c-bg-soft:
        light: "rgba(255, 250, 244, 0.84)"
        dark: "rgba(18, 24, 32, 0.78)"
    --vp-c-bg-alt:
        light: "rgba(241, 235, 228, 0.96)"
        dark: "rgba(20, 28, 38, 0.94)"
    --vp-c-bg-elv:
        light: "rgba(255, 251, 245, 0.92)"
        dark: "rgba(16, 21, 29, 0.92)"
    --vp-c-text-1:
        light: "rgba(24, 28, 34, 0.98)"
        dark: "rgba(245, 237, 229, 0.96)"
    --vp-c-text-2:
        light: "rgba(73, 79, 89, 0.82)"
        dark: "rgba(203, 193, 184, 0.84)"
    --vp-c-text-3:
        light: "rgba(105, 111, 121, 0.68)"
        dark: "rgba(164, 154, 146, 0.7)"
    --vp-c-divider:
        light: "rgba(35, 41, 49, 0.1)"
        dark: "rgba(239, 227, 216, 0.12)"
    --hero-name-font: "var(--vp-font-family-mono)"
    --hero-text-font: '"IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif'
    --hero-tagline-font: "var(--vp-font-family-base)"
    --hero-name-font-size: "clamp(0.78rem, 0.96vw, 0.94rem)"
    --hero-name-weight: "700"
    --hero-name-letter-spacing: "0.24em"
    --hero-name-line-height: "1.1"
    --hero-name-max-width: "28rem"
    --hero-name-accent-color:
        light: "linear-gradient(90deg, rgba(184, 103, 56, 0.94) 0%, rgba(94, 118, 147, 0.74) 100%)"
        dark: "linear-gradient(90deg, rgba(239, 189, 149, 0.94) 0%, rgba(139, 165, 194, 0.82) 100%)"
    --hero-name-accent-scale: "1"
    --hero-name-accent-height: "2px"
    --hero-text-font-size: "clamp(3.4rem, 6.5vw, 6.2rem)"
    --hero-text-weight: "800"
    --hero-text-letter-spacing: "-0.06em"
    --hero-text-line-height: "0.88"
    --hero-text-max-width: "8ch"
    --hero-tagline-font-size: "clamp(1.02rem, 1.62vw, 1.2rem)"
    --hero-tagline-weight: "500"
    --hero-tagline-line-height: "1.5"
    --hero-tagline-letter-spacing: "-0.015em"
    --hero-tagline-max-width: "42rem"
    --hero-tagline-padding-top: "18px"
    --hero-heading-gap: "0.14em"
    --vp-home-hero-image-background-image:
        light: "radial-gradient(circle at center, rgba(184, 103, 56, 0.12) 0%, rgba(94, 118, 147, 0.08) 48%, transparent 82%)"
        dark: "radial-gradient(circle at center, rgba(239, 189, 149, 0.16) 0%, rgba(139, 165, 194, 0.1) 54%, transparent 84%)"
featuresConfig:
    scroll:
        speed: 0.22
        gap: 20
        gapTablet: 22
        gapDesktop: 28
        minItems: 10
    cards:
        width: 286
        widthTablet: 320
        widthDesktop: 348
hero:
    name: "EN-US / TOOLKIT BOX"
    text: "TOOLKIT\nBOX"
    tagline: "Toolkit Box written by M1hono. This surface covers FGO servant portrait lookup and card generation, Arknights operator portrait lookup and story tracking, Minecraft locale JSON editing, and Manaweave guidebook, ritual, and rune tools."
    typography:
        type: none
    background:
        opacity: 1
        brightness: 1
        contrast: 1.02
        saturation: 1
        layers:
            - type: color
              zIndex: 1
              color:
                  gradient:
                      enabled: true
                      type: linear
                      direction: 135deg
                      stops:
                          - color:
                                light: "rgba(249, 244, 238, 1)"
                                dark: "rgba(11, 14, 19, 1)"
                            position: "0%"
                          - color:
                                light: "rgba(240, 234, 227, 1)"
                                dark: "rgba(15, 20, 28, 1)"
                            position: "52%"
                          - color:
                                light: "rgba(233, 238, 244, 0.98)"
                                dark: "rgba(21, 28, 38, 0.98)"
                            position: "100%"
    image:
        type: image
        background:
            enabled: true
        width: "420px"
        height: "324px"
        fit: contain
        position: center
        image:
            src: /logo.svg
            alt: M1hono Toolkit Box logo
        frame:
            shape: custom
            width: "444px"
            height: "340px"
            padding: "26px"
            border:
                light: "1px solid rgba(37, 41, 48, 0.08)"
                dark: "1px solid rgba(244, 229, 215, 0.1)"
            radius: "20px"
            clipPath: "polygon(0 0, 92% 0, 100% 10%, 100% 100%, 8% 100%, 0 90%)"
            background:
                light: "linear-gradient(180deg, rgba(255, 252, 248, 0.92) 0%, rgba(241, 235, 228, 0.84) 100%)"
                dark: "linear-gradient(180deg, rgba(17, 22, 30, 0.94) 0%, rgba(23, 30, 40, 0.88) 100%)"
            shadow:
                light: "0 24px 56px rgba(28, 24, 20, 0.08)"
                dark: "0 28px 72px rgba(0, 0, 0, 0.34)"
    colors:
        title:
            light: "rgba(25, 29, 35, 0.98)"
            dark: "rgba(245, 237, 229, 0.96)"
        text:
            light: "rgba(22, 26, 32, 1)"
            dark: "rgba(248, 241, 234, 1)"
        tagline:
            light: "rgba(77, 83, 93, 0.9)"
            dark: "rgba(200, 190, 182, 0.88)"
        navText:
            light: "rgba(40, 45, 54, 0.82)"
            dark: "rgba(239, 230, 221, 0.88)"
        navTextHover:
            light: "rgba(184, 103, 56, 1)"
            dark: "rgba(239, 189, 149, 1)"
        navTextScrolled:
            light: "rgba(33, 37, 44, 0.9)"
            dark: "rgba(244, 235, 226, 0.92)"
        navTextHoverScrolled:
            light: "rgba(184, 103, 56, 1)"
            dark: "rgba(239, 189, 149, 1)"
        navBackground:
            light: "rgba(250, 245, 239, 0.58)"
            dark: "rgba(14, 19, 27, 0.58)"
        navBackgroundScrolled:
            light: "rgba(250, 245, 239, 0.92)"
            dark: "rgba(14, 19, 27, 0.9)"
        searchBackground:
            light: "rgba(255, 252, 247, 0.72)"
            dark: "rgba(19, 25, 34, 0.54)"
        searchBackgroundScrolled:
            light: "rgba(255, 252, 247, 0.88)"
            dark: "rgba(19, 25, 34, 0.72)"
        searchHoverBackground:
            light: "rgba(255, 252, 247, 0.84)"
            dark: "rgba(24, 31, 41, 0.72)"
        searchHoverBackgroundScrolled:
            light: "rgba(255, 252, 247, 0.94)"
            dark: "rgba(24, 31, 41, 0.84)"
        searchText:
            light: "rgba(39, 44, 52, 0.86)"
            dark: "rgba(245, 236, 227, 0.94)"
        searchTextScrolled:
            light: "rgba(34, 39, 46, 0.9)"
            dark: "rgba(245, 236, 227, 0.96)"
        searchTextMuted:
            light: "rgba(39, 44, 52, 0.54)"
            dark: "rgba(245, 236, 227, 0.68)"
        searchTextMutedScrolled:
            light: "rgba(39, 44, 52, 0.62)"
            dark: "rgba(245, 236, 227, 0.76)"
        searchBorder:
            light: "rgba(43, 49, 56, 0.1)"
            dark: "rgba(245, 236, 227, 0.12)"
        searchBorderScrolled:
            light: "rgba(43, 49, 56, 0.14)"
            dark: "rgba(245, 236, 227, 0.16)"
        searchKeyBackground:
            light: "rgba(43, 49, 56, 0.06)"
            dark: "rgba(245, 236, 227, 0.1)"
        searchKeyBackgroundScrolled:
            light: "rgba(43, 49, 56, 0.08)"
            dark: "rgba(245, 236, 227, 0.14)"
        searchKeyText:
            light: "rgba(43, 49, 56, 0.56)"
            dark: "rgba(245, 236, 227, 0.72)"
        searchKeyTextScrolled:
            light: "rgba(43, 49, 56, 0.64)"
            dark: "rgba(245, 236, 227, 0.8)"
    actions:
        - theme: brand
          text: "FGO Lookup"
          link: /en-US/Fgo/
        - theme: alt
          text: "Arknights Lookup"
          link: /en-US/Arknights/
        - theme: alt
          text: "Locale JSON"
          link: /en-US/Mc/JsonTranslator
        - theme: outline
          text: "Manaweave Editors"
          link: /en-US/Mna/
features:
    - title: "Servant Portrait Lookup"
      details: "Search servant records, select variants, crop portraits, and export files."
      icon: "FGO"
      link: /en-US/Fgo/CharaFinder
      linkText: "Open"
    - title: "FGO Card Generator"
      details: "Generate card images from uploaded art, text fields, icons, and stats."
      icon: "CARD"
      link: /en-US/Fgo/CardGenerator
      linkText: "Open"
    - title: "Operator Portrait Lookup"
      details: "Search operator records, choose portrait variants, and export results."
      icon: "AK"
      link: /en-US/Arknights/CharaFinder
      linkText: "Open"
    - title: "Story Tracker"
      details: "Find operator story appearances and open related reading links."
      icon: "LOG"
      link: /en-US/Arknights/StoryTracker
      linkText: "Open"
    - title: "JSON Translator"
      details: "Edit source and target locale JSON, review missing keys, and export."
      icon: "JSON"
      link: /en-US/Mc/JsonTranslator
      linkText: "Open"
    - title: "Manaweave Editors"
      details: "Guidebook, ritual, and runescribing tools under one surface."
      icon: "MNA"
      link: /en-US/Mna/
      linkText: "Open"
gitChangelog: false
---
