import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// File extensions that are safe to read as text
const TEXT_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.css', '.scss', '.sass', '.less',
    '.html', '.htm', '.vue', '.svelte',
    '.json', '.yaml', '.yml', '.toml', '.env',
    '.md', '.mdx', '.txt',
    '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h',
    '.sh', '.zsh', '.bash',
    '.prisma', '.graphql', '.gql',
    '.swift', '.kt', '.dart',
    '.xml', '.svg',
]);

const MAX_FILE_SIZE = 50 * 1024; // 50KB per file
const MAX_FILES = 30;
const MAX_CONTEXT_CHARS = 100_000; // Context cap to avoid API timeouts

const IGNORE_DIRS = new Set([
    'node_modules', '.next', '.git', 'dist', 'build', '.cache',
    '__pycache__', '.venv', 'venv', '.vercel', '.serverless',
    'coverage', 'out', '.turbo', '.parcel-cache', 'vendor'
]);

function isTextFile(filePath: string): boolean {
    return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function readFilesRecursively(dir: string, prefix = ''): { name: string; content: string }[] {
    const results: { name: string; content: string }[] = [];
    let entries: fs.Dirent[] = [];

    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return results;
    }

    for (const entry of entries) {
        if (results.length >= MAX_FILES) { break; }
        if (entry.name.startsWith('.') && entry.name !== '.env') { continue; }
        if (IGNORE_DIRS.has(entry.name)) { continue; }

        const fullPath = path.join(dir, entry.name);
        const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            results.push(...readFilesRecursively(fullPath, relativeName));
        } else if (entry.isFile() && isTextFile(fullPath)) {
            try {
                const stat = fs.statSync(fullPath);
                if (stat.size > MAX_FILE_SIZE) {
                    results.push({ name: relativeName, content: `[File too large — ${Math.round(stat.size / 1024)}KB, skipped]` });
                } else {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    results.push({ name: relativeName, content });
                }
            } catch {
                results.push({ name: relativeName, content: '[Error reading file]' });
            }
        }
    }
    return results;
}

export function activate(context: vscode.ExtensionContext) {
    const provider = new PokeAgentsViewProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(PokeAgentsViewProvider.viewType, provider)
    );
}

class PokeAgentsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'poke-agents-dashboard';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri,
                vscode.Uri.file(path.join(this._extensionUri.fsPath, 'dist'))
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'selectFolder': {
                    const result = await vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        openLabel: 'Assign to Poke-Agent'
                    });
                    if (result?.[0]) {
                        this._view?.webview.postMessage({ type: 'folderSelected', path: result[0].fsPath });
                    }
                    break;
                }
                case 'selectSkill': {
                    const result = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: { 'Skill Manual': ['md', 'txt'] },
                        openLabel: 'Assign Skill Manual'
                    });
                    if (result?.[0]) {
                        this._view?.webview.postMessage({ type: 'skillSelected', path: result[0].fsPath });
                    }
                    break;
                }
                case 'saveSquad': {
                    await this._context.globalState.update('pokeSquad', data.squad);
                    break;
                }
                case 'loadSquad': {
                    const squad = this._context.globalState.get('pokeSquad', []);
                    this._view?.webview.postMessage({ type: 'squadLoaded', squad });
                    break;
                }
                case 'triggerReview': {
                    await this.reviewFolder(data.agent);
                    break;
                }
            }
        });
    }

    public async reviewFolder(agent: any) {
        const { folderPath, skillPath, name: agentName, type: agentType } = agent;

        if (!folderPath || !fs.existsSync(folderPath)) {
            vscode.window.showErrorMessage(`${agentName}: Folder not found — ${folderPath}`);
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `⚡ ${agentName} is launching a Review Quest...`,
            cancellable: false
        }, async (progress) => {

            // ── 1. Scan files ─────────────────────────────────────────────────
            progress.report({ message: 'Scanning your codebase...' });
            const files = readFilesRecursively(folderPath);

            // ── 2. Apply context cap ──────────────────────────────────────────
            let contextText = '';
            let charsUsed = 0;
            let filesIncluded = 0;

            for (const file of files) {
                const entry = `\n\n### FILE: ${file.name}\n\`\`\`\n${file.content}\n\`\`\``;
                if (charsUsed + entry.length > MAX_CONTEXT_CHARS) {
                    contextText += `\n\n> ⚡ Context cap reached — ${files.length - filesIncluded} more files were omitted to prevent timeout.`;
                    break;
                }
                contextText += entry;
                charsUsed += entry.length;
                filesIncluded++;
            }

            progress.report({ message: `Scanned ${filesIncluded}/${files.length} files (${Math.round(charsUsed / 1000)}k chars). Building prompt...` });

            // ── 3. Read skill file ────────────────────────────────────────────
            let skillText = `You are a senior software architect performing a brutal but constructive code review.
Focus on: code quality, performance, security, maintainability, and best practices.`;
            if (skillPath && fs.existsSync(skillPath)) {
                skillText = fs.readFileSync(skillPath, 'utf8');
            }

            // ── 4. Build master prompt ────────────────────────────────────────
            const folderName = path.basename(folderPath);
            const now = new Date().toLocaleString();

            const systemPrompt = `You are ${agentName}, a ${agentType}-type Pokémon Sub-Agent and elite code reviewer.
Your personality: Direct, ruthless, brilliant. No sugarcoating. Every flaw gets identified and a concrete fix is prescribed.

SKILL RULES:
${skillText}`;

            const userPrompt = `Review the following codebase and produce a formal PRD-style report.

TARGET: ${folderName} (${filesIncluded}/${files.length} files scanned)
DATE: ${now}

${contextText}

---

Produce a structured report in this EXACT format:

# 🔥 ${agentName.toUpperCase()} REVIEW REPORT
### Target: \`${folderName}\` | Agent: ${agentName} (${agentType}) | ${now}

---

## EXECUTIVE SUMMARY
[2–3 sentence brutal summary of the overall code health]

**Overall Score:** [X/10] — [one-word verdict: CRITICAL / POOR / FAIR / GOOD / EXCELLENT]

---

## 🚨 CRITICAL FLAWS
[List every critical bug, security hole, or crash risk with:
- **[FLAW NAME]** — *Severity: CRITICAL*
  - **File:** \`filename.ext\` (line reference if possible)
  - **Problem:** clear description
  - **Fix:** exact code or approach to resolve]

---

## ⚠️ HIGH PRIORITY ISSUES
[Same format, for significant but non-critical issues]

---

## 🔧 MEDIUM PRIORITY
[Same format, for code quality, maintainability, and performance issues]

---

## 💡 IMPROVEMENTS & SUGGESTIONS
[Forward-looking recommendations — architecture, DX, scalability]

---

## 📋 ACTION ITEMS
| Priority | Item | File | Effort |
|----------|------|------|--------|
[Fill this table with ranked action items]

---

## 🗺️ IMPROVEMENT ROADMAP
- **Sprint 1 (Now):** [Critical fixes]
- **Sprint 2 (This week):** [High priority]
- **Sprint 3 (Next week):** [Medium + improvements]

---
*Review conducted by ${agentName} • PokéDex Extension*`;

            // ── 5. Open document immediately so user sees activity ────────────
            progress.report({ message: 'Opening report... AI is writing live ⚡' });

            const doc = await vscode.workspace.openTextDocument({
                content: `<!-- ⚡ ${agentName} is writing your review in real-time... -->\n\n`,
                language: 'markdown'
            });
            const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Active);

            let usedAI = false;

            // ── 6. Try VS Code Language Model API with LIVE STREAMING ─────────
            try {
                const models = await vscode.lm.selectChatModels({
                    vendor: 'copilot',
                    family: 'gpt-4o'
                });

                if (models.length > 0) {
                    const model = models[0];
                    const messages = [
                        vscode.LanguageModelChatMessage.User(`${systemPrompt}\n\n${userPrompt}`)
                    ];

                    // Clear placeholder text before streaming starts
                    await editor.edit(editBuilder => {
                        const fullRange = new vscode.Range(
                            doc.positionAt(0),
                            doc.positionAt(doc.getText().length)
                        );
                        editBuilder.replace(fullRange, '');
                    });

                    const response = await model.sendRequest(messages, {});

                    // ⚡ Stream each chunk live into the document
                    for await (const chunk of response.text) {
                        await editor.edit(editBuilder => {
                            const lastLine = doc.lineAt(doc.lineCount - 1);
                            editBuilder.insert(lastLine.range.end, chunk);
                        });
                    }
                    usedAI = true;
                }
            } catch (err) {
                console.log('LM API not available, using clipboard fallback:', err);
            }

            // ── 7. Fallback: write assembled prompt into document ─────────────
            if (!usedAI) {
                const fallbackContent = `<!-- ⚠️  GitHub Copilot not detected. This is the Review Quest PROMPT.
     Paste it into ChatGPT, Claude, or any AI to get the full report. -->

${systemPrompt}

${userPrompt}`;
                await editor.edit(editBuilder => {
                    const fullRange = new vscode.Range(
                        doc.positionAt(0),
                        doc.positionAt(doc.getText().length)
                    );
                    editBuilder.replace(fullRange, fallbackContent);
                });
                await vscode.env.clipboard.writeText(`${systemPrompt}\n\n${userPrompt}`);
            }

            const msg = usedAI
                ? `${agentName} completed the Review Quest! Report written live. 🔥`
                : `${agentName} assembled the Review Quest prompt. Copilot not found — paste it into your AI. (Copied to clipboard)`;

            vscode.window.showInformationMessage(msg);
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const webviewDistPath = path.join(this._extensionUri.fsPath, 'dist', 'webview');
        const indexPath = path.join(webviewDistPath, 'index.html');

        // Read the Vite-built index.html
        let html = fs.readFileSync(indexPath, 'utf8');

        // Replace relative asset paths with proper VS Code Webview URIs
        html = html.replace(/(src|href)="\.\/([^"]+)"/g, (_, attr, file) => {
            const resourcePath = path.join(webviewDistPath, file);
            const uri = webview.asWebviewUri(vscode.Uri.file(resourcePath));
            return `${attr}="${uri}"`;
        });

        return html;
    }
}
