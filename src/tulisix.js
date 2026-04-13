export default class Tulisix {
    #rules = [];
    #template;

    constructor() {
        this.#template = document.createElement("template");
    }

    addRule(newRules) {
        if (!newRules) return;

        const rules = Array.isArray(newRules) ? newRules : [newRules];

        for (const rule of rules) {
            if (typeof rule !== "object" || rule === null) {
                throw new TypeError("Each rule must be a valid object.");
            }

            if (!rule.from) {
                throw new Error("Rule is missing the required 'from' property.");
            }

            if (typeof rule.from !== "string" && !Array.isArray(rule.from)) {
                throw new TypeError("Rule 'from' property must be a string or an array of strings.");
            }

            if (typeof rule.to !== "string" && typeof rule.to !== "function") {
                throw new TypeError("Rule 'to' property must be a string or a function.");
            }

            const patterns = Array.isArray(rule.from) ? rule.from : [rule.from];
            const caseSensitive = rule.caseSensitive !== false;

            for (const pattern of patterns) {
                if (typeof pattern !== "string") {
                    throw new TypeError(`Invalid pattern in 'from': ${pattern}. Must be a string.`);
                }

                const compiled = this.#compile(pattern, caseSensitive);

                this.#rules.push({
                    regex: compiled.regex,
                    varNames: compiled.varNames,
                    to: rule.to
                });
            }
        }
    }

    #compile(pattern, caseSensitive) {
        const varNames = [];

        pattern = pattern
            .replace(/\\\{/g, "__ESCAPED_OPEN__")
            .replace(/\\\}/g, "__ESCAPED_CLOSE__");

        const parts = [];
        let lastIndex = 0;

        const varRegex = /\{([a-zA-Z0-9_]+)\}/g;
        let match;

        while ((match = varRegex.exec(pattern))) {
            const [full, name] = match;
            const start = match.index;

            const beforeText = pattern.slice(lastIndex, start);
            parts.push(beforeText.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

            varNames.push(name);

            const isEnd = start + full.length === pattern.length;
            parts.push(isEnd ? "([^\\s<]+)" : "(.*?)");

            lastIndex = start + full.length;
        }

        const remainingText = pattern.slice(lastIndex);
        parts.push(remainingText.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));

        let finalRegex = parts.join("");

        finalRegex = finalRegex
            .replace(/__ESCAPED_OPEN__/g, "\\{")
            .replace(/__ESCAPED_CLOSE__/g, "\\}");

        return {
            regex: new RegExp(finalRegex, caseSensitive ? "g" : "gi"),
            varNames
        };
    }

    replace(target) {
        if (!this.#rules.length) return;

        let roots;

        if (typeof target === "string") {
            roots = document.querySelectorAll(target);
        } else if (target instanceof Element) {
            roots = [target];
        } else if (target instanceof NodeList || Array.isArray(target)) {
            roots = target;
        } else {
            throw new TypeError("replace() requires a valid CSS selector string, a DOM Element, or a NodeList.");
        }

        if (!roots || roots.length === 0) return;

        for (const root of roots) {
            const initialNodes = this.#collectTextNodes(root);

            for (const initialNode of initialNodes) {
                let currentTextNodes = [initialNode];

                for (const rule of this.#rules) {
                    const nextTextNodes = [];

                    for (const node of currentTextNodes) {
                        if (node.parentNode) {
                            this.#applyRuleToNode(node, rule, nextTextNodes);
                        }
                    }
                    currentTextNodes = nextTextNodes;
                }
            }
        }
    }

    #collectTextNodes(root) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodes = [];
        let node;

        while ((node = walker.nextNode())) {
            if (node.nodeValue.trim()) {
                nodes.push(node);
            }
        }

        return nodes;
    }

    #applyRuleToNode(textNode, rule, resultingTextNodes) {
        const { regex, varNames, to } = rule;
        regex.lastIndex = 0;

        const match = regex.exec(textNode.nodeValue);
        if (!match || match[0].length === 0) {
            if (textNode.nodeValue.length > 0) {
                resultingTextNodes.push(textNode);
            }
            return;
        }

        const startIndex = match.index;
        const matchLength = match[0].length;

        const matchNode = textNode.splitText(startIndex);
        const remainingNode = matchNode.splitText(matchLength);

        if (textNode.nodeValue.length > 0) {
            resultingTextNodes.push(textNode);
        }

        const safeVars = {};
        const rawVars = {};

        for (let i = 0; i < varNames.length; i++) {
            const rawValue = match[i + 1] ?? "";
            rawVars[varNames[i]] = rawValue;
            safeVars[varNames[i]] = this.#escapeHTML(rawValue);
        }

        let replacementContent;
        if (typeof to === "function") {
            replacementContent = to(safeVars, match, rawVars);
        } else {
            replacementContent = this.#injectVars(to, rawVars);
        }

        this.#template.innerHTML = replacementContent;
        const fragment = this.#template.content.cloneNode(true);
        matchNode.parentNode.replaceChild(fragment, matchNode);

        this.#applyRuleToNode(remainingNode, rule, resultingTextNodes);
    }

    #injectVars(template, vars) {
        return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
            return this.#escapeHTML(vars[name] ?? "");
        });
    }

    #escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
    }
}