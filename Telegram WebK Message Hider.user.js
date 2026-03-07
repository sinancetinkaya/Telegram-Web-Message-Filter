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
    if (groupNode.querySelector(".btn-container")) return;

    let message = groupNode.querySelector("[data-peer-id]");
    if (!message) return;

    const user_id = message.getAttribute("data-peer-id");
    const isBlocked = await GM_getValue(user_id, false);

    // 1. We keep the group relative so the buttons don't float outside it
    groupNode.style.position = 'relative';

    const container = document.createElement("div");
    container.className = "btn-container";

    // 2. Use sticky instead of absolute to keep it CONTAINED in the group
    Object.assign(container.style, {
        position: "sticky",
        top: "0px",
        left: "0px",
        zIndex: "100",
        display: "flex",
        gap: "5px",
        paddingBottom: "5px",
        backgroundColor: "transparent" // Keeps it clean against the chat background
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

    // 3. Prepend to ensure it is the first child, but inside the container
    groupNode.prepend(container);
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
