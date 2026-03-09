// ==UserScript==
// @name         Telegram Web Message Filter
// @namespace    https://github.com/sinancetinkaya/Telegram-Web-Message-Filter
// @version      2026-03-10
// @license      MIT
// @description  Hides messages from users in Telegram groups
// @author       sinancetinkaya
// @match        https://web.telegram.org/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

const SUPPORTED_TELEGRAM_WEB_VERSIONS = ['a','k'];
const TELEGRAM_WEB_VERSION = window.location.pathname.split('/')[1];


(async function() {
    'use strict';

    if(!SUPPORTED_TELEGRAM_WEB_VERSIONS.includes(TELEGRAM_WEB_VERSION)) {
      console.log("UNSUPPORTED TELEGRAM WEB VERSION: " + TELEGRAM_WEB_VERSION);
      return;
    }

    async function addButtons(groupNode) {
        // Double-check to prevent duplicate buttons
        if (groupNode.querySelector(".btn-container")) return;

        let message;

        if(TELEGRAM_WEB_VERSION == "a")
          message = groupNode.querySelector("div[class*='shown'] > div[class^='Avatar'][data-peer-id]");
        else
          message = groupNode.querySelector("div.bubbles-group-avatar-container > div.avatar,data-peer-id");

        if (!message) return;

        const user_id = message.getAttribute("data-peer-id");
        const isFiltered = await GM_getValue(user_id, false);

        // groupNode.style.position = 'relative';

        const container = document.createElement("div");
        container.className = "btn-container";

        Object.assign(container.style, {
            position: "absolute",
            top: "0px",
            right: "25px",
            zIndex: "100",
            display: "flex",
            gap: "5px",
            padding: "4px 0",
            marginBottom: "5px",
            backgroundColor: "transparent"
        });

        const buttonStyle = {
            fontSize: "10px",
            padding: "2px 6px",
            cursor: "pointer",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            color: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
        };

        const toggleBtn = document.createElement("button");
        toggleBtn.innerText = isFiltered ? "Show" : "Hide";
        Object.assign(toggleBtn.style, buttonStyle, { backgroundColor: "#2ea6ff" });

        const filterBtn = document.createElement("button");
        filterBtn.innerText = isFiltered ? "Unfilter" : "Filter";
        Object.assign(filterBtn.style, buttonStyle, { backgroundColor: isFiltered ? "#ff4757" : "#2ea6ff" });

        const setVisibility = (visible) => {
            let bubbles;

            if(TELEGRAM_WEB_VERSION == "a")
            bubbles = groupNode.querySelectorAll(".message-content-wrapper");
            else
            bubbles = groupNode.querySelectorAll(".bubble");

            bubbles.forEach(el => {
                el.style.opacity = visible ? "1" : "0.1";
                el.style.pointerEvents = visible ? "auto" : "none";
            });
        };

        if (isFiltered) setVisibility(false);

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isNowVisible = (toggleBtn.innerText === "Show");
            setVisibility(isNowVisible);
            toggleBtn.innerText = isNowVisible ? "Hide" : "Show";
        };

        filterBtn.onclick = async (e) => {
            e.stopPropagation();
            const currentlyFiltered = await GM_getValue(user_id, false);
            if (currentlyFiltered) {
                await GM_deleteValue(user_id);
                filterBtn.innerText = "Filter";
                filterBtn.style.backgroundColor = "#2ea6ff";
                setVisibility(true);
                toggleBtn.innerText = "Hide";
            } else {
                await GM_setValue(user_id, true);
                filterBtn.innerText = "Unfilter";
                filterBtn.style.backgroundColor = "#ff4757";
                setVisibility(false);
                toggleBtn.innerText = "Show";
            }
        };

        container.appendChild(toggleBtn);
        container.appendChild(filterBtn);
        groupNode.prepend(container);
    }

    const runScan = () => {
        let groups;

        if(TELEGRAM_WEB_VERSION == "a")
          groups = document.querySelectorAll('div[class="messages-container"] div[id^="message-group-"]');
        else
          groups = document.querySelectorAll("div[class='bubbles-group'],[class^='bubbles-group bubbles-group-']");

        groups.forEach(addButtons);
    };

    // 1. MutationObserver handles real-time additions
    const observer = new MutationObserver(runScan);
    observer.observe(document.body, { childList: true, subtree: true });

    // 2. Scroll listener handles the Virtual Scroller's recycling of elements
    window.addEventListener('scroll', runScan, true);

    // Initial check
    runScan();
})();
