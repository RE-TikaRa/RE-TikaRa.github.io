import fs from 'node:fs/promises';
import path from 'node:path';

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

function parseXML(xml, limit) {
    const items = [];
    // Simple regex-based parser for RSS/Atom
    // Note: This is not a full-fledged XML parser but sufficient for standard feeds
    
    // Check if Atom or RSS
    const isAtom = xml.includes('<feed') || xml.includes('xmlns="http://www.w3.org/2005/Atom"');
    
    const itemRegex = isAtom ? /<entry>([\s\S]*?)<\/entry>/g : /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/;
    const linkRegex = isAtom ? /<link[^>]*href="([^"]+)"/ : /<link>([^<]+)<\/link>/;
    const dateRegex = isAtom ? /<updated>([^<]+)<\/updated>/ : /<pubDate>([^<]+)<\/pubDate>/;

    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
        const itemContent = match[1];
        const titleMatch = titleRegex.exec(itemContent);
        const linkMatch = linkRegex.exec(itemContent);
        const dateMatch = dateRegex.exec(itemContent);

        if (titleMatch && linkMatch) {
            // Decode HTML entities in title if necessary (basic ones)
            let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
            let link = linkMatch[1];
            let date = '';

            if (dateMatch) {
                try {
                    const d = new Date(dateMatch[1]);
                    if (!isNaN(d.getTime())) {
                        // Format: YYYY-MM-DD
                        date = d.toISOString().split('T')[0];
                    }
                } catch (e) {
                    // Keep empty if parsing fails
                }
            }

            items.push({
                title: title.trim(),
                link: link.trim(),
                date: date
            });
        }
    }

    return items;
}

fetchRSS();
