import type { Preview } from "@storybook/nextjs";
import "../src/app/globals.css";

// Interface for React elements with internal properties
interface ReactElement extends HTMLElement {
  _reactInternalFiber?: unknown;
  _reactInternalInstance?: unknown;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: "#040404",
        },
        {
          name: "light",
          value: "#ffffff",
        },
      ],
    },
  },
};

// Initialize Fiddle injection scripts for spot edit and animate tools
if (typeof window !== "undefined") {
  // Injection script variables
  let isSelectionMode = false;
  let isAnimationMode = false;
  let selectedElement: HTMLElement | null = null;
  let hoveredElement: HTMLElement | null = null;
  let currentNodeId: string | null = null;
  let animatableElements: HTMLElement[] = [];
  let controlsElements: HTMLElement[] = [];
  let storiesFetched = false;

  // Create and inject styles
  const style = document.createElement("style");
  style.textContent = `
    .fiddle-selected {
      outline: 1px solid blue !important;
    }
    .fiddle-hovered {
      outline: 1px dashed blue !important;
    }
    .fiddle-animatable {
      outline: 1px solid blue !important;
      position: relative;
    }
    .fiddle-controls {
      position: absolute;
      right: 0;
      bottom: 0;
      background: #171717;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      cursor: pointer;
    }
    .fiddle-loading {
      pointer-events: none !important;
      position: relative !important;
    }
    .fiddle-loading::after {
      content: '';
      position: absolute;
      inset: 0;
      background-color: rgba(75, 75, 75, 0.5);
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      z-index: 1000;
    }
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `;
  document.head.appendChild(style);

  // Function to fetch Storybook stories
  function fetchStorybookStories() {
    if (storiesFetched) {
      return;
    }

    try {
      // Add cache-busting parameter to prevent browser caching
      const timestamp = Date.now();
      const response = fetch(`./index.json?t=${timestamp}`, {
        cache: "no-cache",
      });

      response
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          (window.top || window.parent).postMessage(
            {
              type: "STORYBOOK_STORIES_LOADED",
              stories: Object.values(data.entries),
            },
            "*"
          );

          storiesFetched = true;
        })
        .catch((error) => {
          console.error("Error fetching Storybook stories:", error);
          (window.top || window.parent).postMessage(
            {
              type: "STORYBOOK_STORIES_ERROR",
              error: error.message,
            },
            "*"
          );
        });
    } catch (error) {
      console.error("Error fetching Storybook stories:", error);
      (window.top || window.parent).postMessage(
        {
          type: "STORYBOOK_STORIES_ERROR",
          error: error.message,
        },
        "*"
      );
    }
  }

  // Clear selection function
  function clearSelection() {
    if (selectedElement) {
      selectedElement.classList.remove("fiddle-selected", "fiddle-loading");
      selectedElement = null;
    }
    if (hoveredElement) {
      hoveredElement.classList.remove("fiddle-hovered");
      hoveredElement = null;
    }
  }

  // Clear animation mode
  function clearAnimationMode() {
    animatableElements.forEach((element) => {
      element.classList.remove("fiddle-animatable");
    });
    controlsElements.forEach((control) => {
      control.remove();
    });
    animatableElements = [];
    controlsElements = [];
  }

  // Initialize animations for selected element only
  function initializeAnimations() {
    clearAnimationMode();

    // Only make the currently selected element animatable
    if (selectedElement && selectedElement instanceof HTMLElement) {
      selectedElement.classList.add("fiddle-animatable");

      // Generate a unique identifier if the element doesn't have one
      let elementId = selectedElement.dataset.configId || selectedElement.id;
      if (!elementId) {
        // Create a unique ID based on element properties
        const tagName = selectedElement.tagName.toLowerCase();
        const text = selectedElement.textContent?.trim().substring(0, 20) || "";
        const index = Array.from(selectedElement.parentNode?.children || []).indexOf(selectedElement);
        elementId = `${tagName}-${text.replace(/[^a-z0-9]/gi, "")}-${index}`;
        selectedElement.dataset.configId = elementId;
      }

      // Create controls div
      const controls = document.createElement("div");
      controls.className = "fiddle-controls";
      controls.textContent = "Controls";
      controls.dataset.forElementId = elementId;

      // Add click handler for controls
      controls.addEventListener("click", (e) => {
        e.stopPropagation();
        const rect = selectedElement!.getBoundingClientRect();
        window.parent.postMessage(
          {
            type: "ANIMATION_ELEMENT_SELECTED",
            element: {
              configId: elementId,
              position: rect,
              nodeId: currentNodeId,
            },
          },
          "*"
        );
      });

      selectedElement.appendChild(controls);

      // Store references
      animatableElements.push(selectedElement);
      controlsElements.push(controls);

      console.log(`Animation mode setup: made selected element "${elementId}" animatable`);
    } else {
      console.log("Animation mode setup: no element selected");
    }
  }

  // Message listener for parent window communication
  window.addEventListener("message", (event) => {
    if (event.data?.type === "SELECTION_MODE_CHANGE") {
      const { enabled, nodeId, selectionType } = event.data;
      isSelectionMode = enabled;
      isAnimationMode = selectionType === "animate";
      currentNodeId = nodeId;

      if (!enabled) {
        clearSelection();
        clearAnimationMode();
      } else if (isAnimationMode) {
        initializeAnimations();
      }
    }

    if (event.data?.type === "CLEAR_SELECTION") {
      clearSelection();
    }

    if (event.data?.type === "UPDATE_ANIMATION") {
      const { configId, elementId, params } = event.data.payload;
      const targetElement = document.querySelector(
        `[data-config-id="${configId || elementId}"]`
      );

      if (targetElement) {
        const updateEvent = new CustomEvent("animation:update", {
          detail: params,
        });
        targetElement.dispatchEvent(updateEvent);
      }
    }

    if (event.data?.type === "SET_LOADING_STATE") {
      const { loading } = event.data;
      if (selectedElement instanceof HTMLElement) {
        if (loading) {
          selectedElement.classList.add("fiddle-loading");
          selectedElement.classList.remove("fiddle-selected");
        } else {
          selectedElement.classList.remove("fiddle-loading");
        }
      }
    }

    // Add handler for fetching stories
    if (event.data?.type === "FETCH_STORYBOOK_STORIES") {
      fetchStorybookStories();
    }

    // Add handler for resetting story fetch state
    if (event.data?.type === "RESET_STORYBOOK_FETCH") {
      storiesFetched = false;
    }

    // Injection listener for dynamic script injection
    if (event.data?.type === "FIDDLE_INJECT_SCRIPT") {
      try {
        const script = document.createElement("script");
        script.textContent = event.data.script;
        document.head.appendChild(script);
        console.log("Injected script executed");
      } catch (err) {
        console.error("Failed to execute injected script:", err);
      }
    }
  });

  // Add click event listener for element selection
  document.addEventListener("click", (event) => {
    if (!isSelectionMode || isAnimationMode) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    if (target instanceof HTMLElement) {
      // Clear previous selection
      clearSelection();

      // Set new selection
      selectedElement = target;
      target.classList.add("fiddle-selected");

      // Get element information
      const rect = target.getBoundingClientRect();

      // Detect if we're in a React environment
      const reactTarget = target as ReactElement;
      const isReactEnvironment = !!(
        reactTarget._reactInternalFiber
        || reactTarget._reactInternalInstance
        || Object.keys(target).find((key) =>
          key.startsWith("__reactInternalInstance")
        )
      );

      // Generate JSX representation
      let jsx = `<${target.tagName.toLowerCase()}`;

      if (target.id) {
        jsx += ` id="${target.id}"`;
      }
      if (target.className) {
        // Use appropriate attribute based on environment
        jsx += isReactEnvironment
          ? ` className="${target.className}"`
          : ` class="${target.className}"`;
      }

      jsx += `>${
        target.textContent?.trim() || ""
      }</${target.tagName.toLowerCase()}>`;

      // Get stylesheet rules
      const styles: string[] = [];
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          Array.from(sheet.cssRules).forEach((rule) => {
            if (
              rule instanceof CSSStyleRule
              && target.matches(rule.selectorText)
            ) {
              styles.push(`${rule.selectorText} { ${rule.style.cssText} }`);
            }
          });
        } catch {
          // Skip cross-origin stylesheets
        }
      });

      console.log("styles", styles);

      window.parent.postMessage(
        {
          type: "ELEMENT_SELECTED",
          element: {
            jsx,
            styles,
            position: rect,
            nodeId: currentNodeId,
          },
        },
        "*"
      );
    }
  });

  // Add hover effects
  document.addEventListener("mouseover", (event) => {
    if (!isSelectionMode || isAnimationMode) return;

    const target = event.target;
    if (target instanceof HTMLElement && target !== selectedElement) {
      if (hoveredElement && hoveredElement !== target) {
        hoveredElement.classList.remove("fiddle-hovered");
      }
      hoveredElement = target;
      target.classList.add("fiddle-hovered");

      console.log('[Fiddle] fiddle-hovered triggered on:', target);

      // Send hover data to parent
      window.parent.postMessage({
        type: 'HOVER_ELEMENT',
        data: { /* ... */ }
      }, '*');
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (!isSelectionMode || isAnimationMode) return;

    const target = event.target;
    if (target instanceof HTMLElement && target === hoveredElement) {
      target.classList.remove("fiddle-hovered");
      hoveredElement = null;
    }
  });

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    // Call initialization after FIDDLE_INJECTION_READY
    window.parent.postMessage({ type: "FIDDLE_INJECTION_READY" }, "*");
    initializeAnimations();

    // Reset storiesFetched flag on page load to ensure fresh fetching
    storiesFetched = false;

    // Try to fetch stories on load
    if (window.location.pathname === "/iframe.html") {
      fetchStorybookStories();
    }
  });

  // If DOM is already loaded, initialize immediately
  if (document.readyState === "loading") {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already loaded
    window.parent.postMessage({ type: "FIDDLE_INJECTION_READY" }, "*");
    initializeAnimations();

    // Reset storiesFetched flag
    storiesFetched = false;

    // Try to fetch stories
    if (window.location.pathname === "/iframe.html") {
      fetchStorybookStories();
    }
  }
}

export default preview;
