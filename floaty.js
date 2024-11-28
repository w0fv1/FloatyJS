import {
    css,
    html,
    LitElement,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

// 获取配置参数函数
function getConfig(key, defaultVal) {
    const moduleUrl = import.meta.url;

    const scripts = document.querySelectorAll('script[type="module"][src]');
    const currentScript = Array.from(scripts).find((script) => {
        // Resolve the script's src to an absolute URL for comparison
        const scriptSrc = new URL(script.src, document.baseURI).href;
        return scriptSrc === moduleUrl;
    });

    console.log(currentScript);
    if (currentScript) {
        let value = currentScript.getAttribute("data-" + key);
        console.log(key, value);
        return value !== undefined && value !== null && value !== ""
            ? value
            : defaultVal;
    }
    return defaultVal;
}

class FloatyButton extends LitElement {
    static properties = {
        themeColor: { type: String, attribute: "theme-color" },
        buttonText: { type: String, attribute: "button-text" },
        tooltipText: { type: String, attribute: "tooltip-text" }, // 新增提示内容属性
        isTooltipVisible: { type: Boolean, state: true }, // 控制提示显示的内部状态
    };

    static styles = css`
        :host {
            --main-color: #000000; /* 默认颜色 */
            --hover-filter: brightness(1.10); /* 鼠标悬浮时的亮度调整 */
            --active-filter: brightness(0.90); /* 按下时的亮度调整 */
        }

        .container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            z-index: 1000;
        }

        button {
            padding: 10px 15px;
            background-color: var(--main-color);
            color: #fff;
            border: none;
            border-radius: 50px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s ease, transform 0.1s ease, filter 0.3s ease;
        }

        button:hover {
            filter: var(--hover-filter);
        }

        button:active {
            filter: var(--active-filter);
            transform: scale(0.95);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .tooltip {
            position: absolute;
            bottom: 50%; /* 垂直居中 */
            right: 100%; /* 放置在按钮左边 */
            transform: translateY(50%); /* 精确垂直对齐 */
            background-color: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            white-space: nowrap;
            margin-right: 10px; /* 按钮与提示之间的距离 */
            pointer-events: none; /* 使提示不影响鼠标事件 */
        }

        .tooltip.visible {
            opacity: 1;
        }
    `;

    constructor() {
        super();
        this.themeColor = "#000000"; // 默认颜色
        this.buttonText = "💬"; // 默认按钮文本
        this.tooltipText = "点击这里打开悬浮窗口"; // 默认提示内容
        this.isTooltipVisible = false; // 提示初始为隐藏
    }

    updated(changedProperties) {
        if (changedProperties.has("themeColor")) {
            this.style.setProperty("--main-color", this.themeColor);
        }
    }

    handleClick() {
        console.log("按钮被点击了！");
        this.hideTooltip(); // 点击按钮时切换提示显示状态
        // 可以在这里添加其他内部逻辑
    }

    // 显示提示
    showTooltip() {
        this.isTooltipVisible = true;
        return this.isTooltipVisible;
    }

    // 隐藏提示
    hideTooltip() {
        this.isTooltipVisible = false;
        return this.isTooltipVisible;
    }

    // 切换提示显示状态
    toggleTooltip() {
        this.isTooltipVisible = !this.isTooltipVisible;
        return this.isTooltipVisible;
    }

    render() {
        return html`
            <div class="container">
                <div class="tooltip ${this.isTooltipVisible ? "visible" : ""}">
                    ${this.tooltipText}
                </div>
                <button @click=${this.handleClick}>${this.buttonText}</button>
            </div>
        `;
    }
}

// 定义悬浮窗口组件
class FloatyWindow extends LitElement {
    static properties = {
        width: { type: String },
        height: { type: String },
        title: { type: String },
        visible: { type: Boolean, reflect: true },
        targetLink: { type: String, attribute: "target-link" },
    };

    static styles = css`
        :host {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-20px);
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001; /* 高于 FloatyButton */
            opacity: 0;
            pointer-events: none; /* 防止不可见时的交互 */
            transition: opacity 0.3s ease, transform 0.3s ease;
            max-width: 88vw; /* 当页面宽度小于窗口宽度时，限制最大宽度 */
            max-height: 90vh; /* 同上，限制最大高度 */
        }

        :host([visible]) {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
            pointer-events: auto; /* 使可见时可以交互 */
        }
        .window-content {
            max-height: 100%;
            max-width: 100%;
        }

        iframe {
            margin: 0;
            padding: 0; /* 移除默认内边距，因为 iframe 会有自己的布局 */
            border-radius: 8px;
            border: none;
            width: 100%;
            height: 100%;
        }
    `;

    constructor() {
        super();
        this.width = "500px"; // 默认宽度
        this.height = "400px"; // 默认高度
        this.visible = false;
        this.targetLink = "/index.html"; // 默认链接
    }

    /**
     * 向 iframe 发送 postMessage 消息
     * @param {any} message - 要发送的消息数据
     * @param {string} [targetOrigin='*'] - 目标源，建议指定以提高安全性
     */
    sendMessage(message, targetOrigin = "*") {
        const iframe = this.shadowRoot.querySelector("iframe");
        if (iframe && iframe.contentWindow) {
            try {
                const url = new URL(this.targetLink, window.location.origin);
                const origin = url.origin;
                iframe.contentWindow.postMessage(
                    message,
                    targetOrigin === "*" ? origin : targetOrigin,
                );
                console.log(`已向 "${origin}" 发送消息:`, message);
            } catch (error) {
                console.error("发送消息时出错:", error);
            }
        } else {
            console.warn("无法访问 iframe 的 contentWindow");
        }
    }

    render() {
        return html`
            <div class="window-content" style="width: ${this.width}; height: ${this.height};">
                <iframe src="${this.targetLink}" ></iframe>
            </div>
        `;
    }
}

customElements.define("floaty-button", FloatyButton);
customElements.define("floaty-window", FloatyWindow);

// 在 DOM 加载完成后将组件添加到页面，并设置属性
document.addEventListener("DOMContentLoaded", () => {
    // 创建 FloatyWindow
    const floatyWindow = document.createElement("floaty-window");
    floatyWindow.width = getConfig("window-width", "400px");
    floatyWindow.height = getConfig("window-height", "300px");
    floatyWindow.targetLink = getConfig("target-link", "/");
    document.body.appendChild(floatyWindow);

    // 创建 FloatyButton
    const floatyButton = document.createElement("floaty-button");
    floatyButton.themeColor = getConfig("theme-color", "#000000");
    floatyButton.buttonText = getConfig("button-text", "💬");
    floatyButton.tooltipText = getConfig(
        "tooltip-text",
        "点击这里打开悬浮窗口",
    );
    document.body.appendChild(floatyButton);
    floatyButton.showTooltip();
    setTimeout(() => {
        floatyButton.hideTooltip();
    }, 2000);
    // 添加点击事件监听器，控制 FloatyWindow 的显示和隐藏
    floatyButton.addEventListener("click", () => {
        floatyWindow.visible = !floatyWindow.visible;

        if (floatyWindow.visible) {
            // 定义要发送的消息
            const message = {
                type: "PageText",
                text: getAllTextContent(),
            };

            // 发送消息到 iframe
            floatyWindow.sendMessage(message);
        }
    });
    // 将 floatyButton 暴露到全局
    window.floatyButton = floatyButton;
    window.floatyWindow = floatyWindow;
});

// // 监听来自 iframe 的消息
// window.addEventListener("message", (event) => {
//     console.log("接收到消息:", event.data.type);
//     // 根据消息类型进行处理
//     if (event.data.type === "PageText") {
//         console.log("收到消息: PageText", event.data.text);
//     }
// });

function getAllTextContent() {
    // 创建一个副本，避免修改真实的 DOM
    const cloneBody = document.body.cloneNode(true);

    // 移除所有脚本和样式标签
    const elementsToRemove = cloneBody.querySelectorAll(
        "script, style, noscript, link, meta",
    );
    elementsToRemove.forEach((el) => el.remove());

    // 使用 innerText 获取纯文本内容
    let textContent = cloneBody.innerText.trim();

    // 去除所有换行符 (\n 和 \r)
    textContent = textContent.replace(/[\r\n]+/g, " ");

    // 将多个空格替换为单个空格
    textContent = textContent.replace(/\s+/g, " ");
    // 返回去除换行符的纯文本
    return textContent;
}
