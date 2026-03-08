// ==UserScript==
// @name         Telegram WebK Message Hider - Final Version
// @namespace    https://github.com/sinancetinkaya/Telegram-Web-Message-Hider
// @version      2026-03-07
// @license      MIT
// @description  Persistent hide/show and block/unblock buttons for Telegram WebK
// @author       sinancetinkaya + modification
// @match        https://web.telegram.org/k/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(async () => {
    'use strict';

    async function addButtons(groupNode) {
        // 1. Check if buttons already exist to prevent duplicates
        if (groupNode.querySelector(".btn-container")) return;

        // 2. Identify the user context
        let message = groupNode.querySelector("*[class='peer-title'][data-peer-id][data-with-premium-icon]");
        if (!message) return;

        const user_id = message.getAttribute("data-peer-id");
        const user_name = message.innerText;
        const isBlocked = await GM_getValue(user_id, false);

        // 3. Ensure the group is a positioned reference for absolute children
        if (getComputedStyle(groupNode).position === 'static') {
            groupNode.style.position = 'relative';
        }

        // 4. Create the floating header container
        const container = document.createElement("div");
        container.className = "btn-container";

        // Position it ABOVE the bubble group
        Object.assign(container.style, {
            position: "absolute",
            top: "0px",
            left: "-50px",
            zIndex: "1000",
            display: "flex",
            gap: "5px",
            pointerEvents: "auto"
        });

        const buttonStyle = {
            fontSize: "12px",
            padding: "4px 8px",
            cursor: "pointer",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            color: "#fff"
        };

        const toggleBtn = document.createElement("button");
        toggleBtn.innerText = isBlocked ? "Show" : "Hide";
        Object.assign(toggleBtn.style, buttonStyle, { backgroundColor: "#2ea6ff" });

        const blockBtn = document.createElement("button");
        blockBtn.innerText = isBlocked ? "Unfilter" : "Filter";
        Object.assign(blockBtn.style, buttonStyle, { backgroundColor: isBlocked ? "#ff4757" : "#2ea6ff" });

        // 5. Opacity-based hiding logic
        const setVisibility = (visible) => {
            const bubbles = groupNode.querySelectorAll(".bubble");
            bubbles.forEach(el => {
                el.style.opacity = visible ? "1" : "0";
                el.style.pointerEvents = visible ? "auto" : "none";
            });
        };

        if (isBlocked) setVisibility(false);

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            let isVisible = (toggleBtn.innerText === "Show");
            setVisibility(isVisible);
            toggleBtn.innerText = isVisible ? "Hide" : "Show";
        };

        blockBtn.onclick = async (e) => {
            e.stopPropagation();
            let currentlyBlocked = await GM_getValue(user_id, false);
            if (currentlyBlocked) {
                await GM_deleteValue(user_id);
                blockBtn.innerText = "Filter";
                blockBtn.style.backgroundColor = "#2ea6ff";
            } else {
                await GM_setValue(user_id, { name: user_name });
                blockBtn.innerText = "Unfilter";
                blockBtn.style.backgroundColor = "#ff4757";
            }
        };

        container.appendChild(toggleBtn);
        container.appendChild(blockBtn);

        // Append to groupNode as an overlay
        groupNode.appendChild(container);
    }

  async function walk(node) {
        if (node.nodeType !== 1) return;
        if (node.matches("div[class='bubbles-group'],[class^='bubbles-group bubbles-group-']")) {
            await addButtons(node);
        }
        for (let child of node.children) {
            await walk(child);
        }
    }

    const observer = new MutationObserver(async (mutations) => {
        for (let { addedNodes } of mutations) {
            for (let node of addedNodes) {
                await walk(node);
            }
        }
    });

    // Initial run and observer setup
    document.querySelectorAll("div[class='bubbles-group'],[class^='bubbles-group bubbles-group-']").forEach(addButtons);
    const target = document.querySelector("#column-center");
    if (target) observer.observe(target, { childList: true, subtree: true });
})();
