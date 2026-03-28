import fs from 'node:fs/promises';

const configPath = new URL('../config.json', import.meta.url);

async function fetchRSS() {
    try {
        const configContent = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configContent);

        if (!config.rss || !config.rss.url) {
            console.log('No RSS URL configured.');
            return;
        }

        console.log(`Fetching RSS from ${config.rss.url}...`);
        const response = await fetch(config.rss.url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch RSS: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const items = parseXML(xmlText, config.rss.max_items || 5);

        if (items.length > 0) {
            config.latest_articles = items;
            await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
            console.log(`Successfully updated ${items.length} articles.`);
        } else {
            console.log('No articles found in RSS feed.');
        }

    } catch (error) {
        console.error('Error fetching/parsing RSS:', error);
    }
}

function decodeXmlEntities(value) {
    return String(value)
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
            const codePoint = Number.parseInt(hex, 16);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
        })
        .replace(/&#(\d+);/g, (_, code) => {
            const codePoint = Number.parseInt(code, 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
        })
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, '\'')
        .replace(/&#39;/g, '\'')
        .replace(/&amp;/g, '&');
}

function normalizeText(value) {
    return decodeXmlEntities(
        String(value)
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    );
}

function extractFirstTagContent(source, tagNames) {
    for (const tagName of tagNames) {
        const match = source.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
        if (match?.[1]) {
            return match[1];
        }
    }
    return '';
}

function extractAtomLink(source) {
    const alternateMatch = source.match(/<link\b[^>]*\brel=(["'])alternate\1[^>]*\bhref=(["'])(.*?)\2[^>]*\/?>/i);
    if (alternateMatch?.[3]) {
        return alternateMatch[3];
    }

    const hrefMatch = source.match(/<link\b[^>]*\bhref=(["'])(.*?)\1[^>]*\/?>/i);
    if (hrefMatch?.[2]) {
        return hrefMatch[2];
    }

    return extractFirstTagContent(source, ['id']);
}

function extractRssLink(source) {
    return extractFirstTagContent(source, ['link', 'guid']);
}

function normalizeDate(rawValue) {
    const text = normalizeText(rawValue);
    if (!text) return '';

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().split('T')[0];
}

function parseXML(xml, limit) {
    const items = [];
    const isAtom = xml.includes('<feed') || xml.includes('xmlns="http://www.w3.org/2005/Atom"');
    const itemRegex = isAtom ? /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi : /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
        const itemContent = match[1];
        const rawTitle = extractFirstTagContent(itemContent, ['title']);
        const rawLink = isAtom ? extractAtomLink(itemContent) : extractRssLink(itemContent);
        const rawDate = isAtom
            ? extractFirstTagContent(itemContent, ['updated', 'published'])
            : extractFirstTagContent(itemContent, ['pubDate', 'dc:date']);
        const title = normalizeText(rawTitle);
        const link = normalizeText(rawLink);
        const date = normalizeDate(rawDate);

        if (title && link) {
            items.push({
                title,
                link,
                date,
            });
        }
    }

    return items;
}

fetchRSS();
