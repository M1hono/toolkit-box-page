import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import enNav from "../config/locale/en-US/nav";
import jaNav from "../config/locale/ja-JP/nav";
import zhNav from "../config/locale/zh-CN/nav";

const repoRoot = path.resolve(import.meta.dirname, "../..");

const locales = [
    {
        code: "zh-CN",
        nav: zhNav,
        text: "Self",
    },
    {
        code: "en-US",
        nav: enNav,
        text: "Self",
    },
    {
        code: "ja-JP",
        nav: jaNav,
        text: "Self",
    },
];

test("Self module is exposed as a top-level locale navigation item", () => {
    for (const locale of locales) {
        const selfItem = locale.nav.find((item) => item.text === locale.text);

        assert.ok(selfItem, `${locale.code} nav should include Self`);
        assert.equal(selfItem.link, "/Self/");
        assert.equal(selfItem.dropdown, undefined);
    }
});

test("Self module has a landing page in each supported locale", () => {
    for (const locale of locales) {
        const pagePath = path.join(repoRoot, "src", locale.code, "Self", "index.md");

        assert.equal(existsSync(pagePath), true, `${locale.code} Self page should exist`);

        const content = readFileSync(pagePath, "utf8");
        assert.match(content, /^root:\s+true$/m);
        assert.match(content, /^collapsed:\s+false$/m);
    }
});

test("Home pages link to the Self module", () => {
    const homePages = [
        {
            path: path.join(repoRoot, "src", "index.md"),
            link: "/en-US/Self/",
        },
        {
            path: path.join(repoRoot, "src", "en-US", "index.md"),
            link: "/en-US/Self/",
        },
        {
            path: path.join(repoRoot, "src", "zh-CN", "index.md"),
            link: "/zh-CN/Self/",
        },
        {
            path: path.join(repoRoot, "src", "ja-JP", "index.md"),
            link: "/ja-JP/Self/",
        },
    ];

    for (const page of homePages) {
        const content = readFileSync(page.path, "utf8");
        assert.ok(
            content.includes(`link: ${page.link}`),
            `${page.path} should link to ${page.link}`,
        );
    }
});
