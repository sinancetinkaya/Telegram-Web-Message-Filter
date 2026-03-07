// ==UserScript==
// @name         Telegram WebK Message Hider - Final Version
// @namespace    https://github.com/sinancetinkaya/Telegram-WebK-Message-Hider
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
    // Prevent re-adding if already present
    if (groupNode.querySelector(".btn-container")) return;

    // Identify the user context
    let message = groupNode.querySelector("[data-peer-id]");
    if (!message) return;

    const user_id = message.getAttribute("data-peer-id");
    const isBlocked = await GM_getValue(user_id, false);

    // Ensure the group acts as a reference for the absolute-positioned buttons
    groupNode.style.position = 'relative';

    const container = document.createElement("div");
    container.className = "btn-container";
    Object.assign(container.style, {
        position: "absolute",
        top: "5px",
        right: "5px",
        zIndex: "1000",
        display: "flex",
        gap: "5px"
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
    blockBtn.innerText = isBlocked ? "Unblock" : "Block";
    Object.assign(blockBtn.style, buttonStyle, { backgroundColor: isBlocked ? "#ff4757" : "#2ea6ff" });

    // Function to toggle opacity while keeping space occupied
    const setVisibility = (visible) => {
        // Target only the message bubble content
        const bubbles = groupNode.querySelectorAll(".bubble");
        bubbles.forEach(el => {
            el.style.opacity = visible ? "1" : "0";
            // Disable interaction when hidden
            el.style.pointerEvents = visible ? "auto" : "none";
        });
    };

    // Initial state
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
            blockBtn.innerText = "Block";
            blockBtn.style.backgroundColor = "#2ea6ff";
        } else {
            await GM_setValue(user_id, { name: "Blocked User" });
            blockBtn.innerText = "Unblock";
            blockBtn.style.backgroundColor = "#ff4757";
        }
    };

    container.appendChild(toggleBtn);
    container.appendChild(blockBtn);
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
