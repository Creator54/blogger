import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------
// 1. ADD YOUR REPOSITORIES HERE
// -----------------------------------------------------
const REPOS = [
    'Creator54/awrit',
    'devswork-in/nix-systems'
];

const POSTS_DIR = path.join(__dirname, '../src/posts');

async function fetchRepoData(repo) {
    console.log(`Fetching data for ${repo}...`);
    const headers = { 'User-Agent': 'Minimal-Blog-Builder' };
    
    // Fetch repo metadata
    const metaRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!metaRes.ok) throw new Error(`Failed to fetch meta for ${repo}: ${metaRes.statusText}`);
    const meta = await metaRes.json();

    // Fetch README
    const readmeRes = await fetch(`https://api.github.com/repos/${repo}/readme`, { headers });
    if (!readmeRes.ok) throw new Error(`Failed to fetch readme for ${repo}: ${readmeRes.statusText}`);
    const readmeData = await readmeRes.json();
    
    // Decode Base64 content
    const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');

    return {
        name: meta.name,
        created_at: meta.created_at.split('T')[0],
        updated_at: meta.updated_at.split('T')[0],
        default_branch: meta.default_branch,
        content: content
    };
}

function processContent(content, repo, branch) {
    const rawBaseUrl = `https://raw.githubusercontent.com/${repo}/${branch}/`;
    const blobBaseUrl = `https://github.com/${repo}/blob/${branch}/`;
    
    // Convert relative images to raw GitHub URLs
    let processed = content.replace(/(!\[.*?\]\()([^http#].*?)(\))/g, (match, prefix, linkPath, suffix) => {
        const cleanPath = linkPath.replace(/^\.\//, '').replace(/^\//, '');
        return `${prefix}${rawBaseUrl}${cleanPath}${suffix}`;
    });

    // Convert relative standard links to GitHub blob URLs
    processed = processed.replace(/(?<!\!)(\[.*?\]\()([^http#].*?)(\))/g, (match, prefix, linkPath, suffix) => {
        const cleanPath = linkPath.replace(/^\.\//, '').replace(/^\//, '');
        return `${prefix}${blobBaseUrl}${cleanPath}${suffix}`;
    });

    return processed;
}

async function sync() {
    if (!fs.existsSync(POSTS_DIR)) {
        fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    for (const repo of REPOS) {
        try {
            const data = await fetchRepoData(repo);
            const processedContent = processContent(data.content, repo, data.default_branch);
            
            // Generate Markdown with frontmatter
            const markdown = `---
title: "${data.name}"
date: "${data.updated_at}"
repo: "${repo}"
---

${processedContent}

---
*This post was auto-generated from the [${repo}](https://github.com/${repo}) README. Last updated: ${data.updated_at}.*
`;
            
            const filePath = path.join(POSTS_DIR, `project-${data.name.toLowerCase()}.md`);
            fs.writeFileSync(filePath, markdown);
            console.log(`✅ Synced ${repo} to ${filePath}`);
        } catch (err) {
            console.error(`❌ Error syncing ${repo}:`, err.message);
        }
    }
}

sync();
