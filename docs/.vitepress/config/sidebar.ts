import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { docsDir } from "./constants";

function readSortedMdFiles(langDir: string, subDir: string) {
    const absPath = path.resolve(docsDir, langDir, subDir);
    if (!fs.existsSync(absPath)) return [];

    return fs
        .readdirSync(absPath)
        .filter((fileName) => fileName.endsWith(".md"))
        .sort()
        .map((fileName) => {
            const fullPath = path.join(absPath, fileName);
            const content = fs.readFileSync(fullPath, "utf-8");

            const match = content.match(/^#\s+(.*)/m);
            const title = match ? match[1].trim() : fileName;

            const idMatch = fileName.match(/^(\d+\.\d+)-/);
            const id = idMatch ? idMatch[1] : fileName.replace(".md", "");

            return { title, id, fileName };
        });
}

export function getSidebar(langDir: string, subDir: string) {
    return readSortedMdFiles(langDir, subDir).map(({ title, id }) => ({
        text: title,
        link: `/${langDir}/${subDir}/${id}`,
    }));
}

export function getNavItems(langDir: string, subDir: string) {
    return readSortedMdFiles(langDir, subDir).map(({ title, id }) => ({
        text: title.replace(/<i[^>]*><\/i>\s*/g, ""),
        link: `/${langDir}/${subDir}/${id}`,
    }));
}

export function getNoticeItems() {
    const absPath = path.resolve(docsDir, "zh_cn", "notice");
    if (!fs.existsSync(absPath)) return [];
    return fs
        .readdirSync(absPath)
        .filter((fileName) => fileName.endsWith(".md"))
        .sort()
        .map((fileName) => {
            const rawName = fileName.replace(".md", "");
            const text = rawName.replace(/^\d+\.\d+-/, "");
            return {
                text,
                link: `#maaly-popup-${encodeURIComponent(rawName)}`,
            };
        });
}

export function getNoticeDates(): Record<string, string> {
    const absPath = path.resolve(docsDir, "zh_cn", "notice");
    if (!fs.existsSync(absPath)) return {};
    const dates: Record<string, string> = {};
    for (const fileName of fs.readdirSync(absPath)) {
        if (!fileName.endsWith(".md")) continue;
        const rawName = fileName.replace(".md", "");
        const fullPath = path.join(absPath, fileName);
        try {
            const date = execSync(
                `git log -1 --format=%aI -- "${fullPath}"`,
                { encoding: "utf-8", cwd: docsDir },
            ).trim();
            if (date) dates[rawName] = date;
        } catch {
            // 文件尚未提交或 git 不可用，跳过
        }
    }
    return dates;
}
