"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CircleHelp, Compass, Sparkles } from "lucide-react";
import { useIntro } from "@devopsnext/starterkit-intro";

/**
 * From the starterkit-intro skill (assets/HelpMenu.jsx): copy it as it is. For a header with no reactstrap
 * dropdowns: it is the whole control, the "?" button and its panel, with the same design as HelpDD.jsx.
 * Colours are the starterkit-theme --dd-* tokens, with light fallbacks; define them for a dark theme.
 *
 * `align="end"` when the button sits at the right edge of the header, so the panel opens leftwards.
 */
export default function HelpMenu({ align = "start" }) {
  const { hasIntro, start, autoStartEnabled, setAutoStartEnabled } = useIntro();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const toggle = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* The tour returns focus to whatever was focused when it started, so the toggle takes it before the panel goes. */
  const takeTour = () => {
    toggle.current?.focus();
    setOpen(false);
    start();
  };

  return (
    <div className="hdd" ref={root}>
      <style>{`
        .hdd { position: relative; display: inline-flex; }
        .hdd-toggle {
          display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px;
          padding: 0; border: 0; border-radius: 8px; background: transparent; color: inherit; cursor: pointer;
        }
        .hdd-toggle:hover, .hdd-toggle[aria-expanded="true"] { background: rgb(100 116 139 / 0.12); }
        .hdd-toggle:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring, rgb(58 160 255 / 0.4)); }
        .hdd-pop {
          position: absolute; top: calc(100% + 6px); left: 0; z-index: 1050; width: 300px;
          max-width: calc(100vw - 16px); padding-bottom: 8px; overflow: hidden; text-align: left;
          background: var(--dd-hover-bg, #f8fafc); border: 1px solid rgb(100 116 139 / 0.2); border-radius: 12px;
          box-shadow: 0 12px 32px rgb(15 23 42 / 0.14);
        }
        .hdd-pop[data-align="end"] { left: auto; right: 0; }
        .hdd-head {
          padding: 12px 16px 10px; border-bottom: 1px solid rgb(100 116 139 / 0.2);
          color: var(--fg2, #64748b); font: 600 11px/1.4 var(--font-heading, inherit);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .hdd-panel { padding: 6px 8px 8px; background: var(--dd-panel-bg, #fff); font-family: var(--font-heading, inherit); }
        .hdd-row {
          display: flex; align-items: center; gap: 11px; width: 100%;
          padding: 9px 10px; border: 0; border-radius: 10px; margin-bottom: 1px;
          background: transparent; text-align: left; cursor: pointer; white-space: normal;
          animation: hdd-in 0.3s ease both;
          transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
        }
        .hdd-row:not([disabled]):hover { background: var(--dd-hover-bg, #f8fafc); box-shadow: var(--dd-hover-shadow, 0 2px 12px rgba(0, 0, 0, 0.07)); transform: translateY(-1px); }
        .hdd-row:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring, rgb(58 160 255 / 0.4)); }
        .hdd-row[disabled] { cursor: not-allowed; opacity: 0.55; }
        .hdd-ico {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.18s ease;
        }
        .hdd-row:not([disabled]):hover .hdd-ico { transform: scale(1.08); }
        .hdd-text { flex: 1; min-width: 0; }
        .hdd-title { display: block; font-size: 13px; font-weight: 600; color: var(--dd-title, #1e293b); line-height: 1.3; }
        .hdd-desc { display: block; font-size: 11.5px; color: var(--dd-desc, #94a3b8); line-height: 1.35; margin-top: 2px; }
        .hdd-track {
          position: relative; width: 34px; height: 20px; border-radius: 10px; flex-shrink: 0;
          background: var(--dd-sep, #cbd5e1); transition: background 0.18s ease;
        }
        .hdd-track[data-on="true"] { background: var(--dd-badge, #2563eb); }
        .hdd-thumb {
          position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
          background: var(--dd-panel-bg, #fff); box-shadow: var(--dd-hover-shadow, 0 2px 12px rgba(0, 0, 0, 0.07)); transition: transform 0.18s ease;
        }
        .hdd-track[data-on="true"] .hdd-thumb { transform: translateX(14px); }
        .hdd-line { height: 1px; background: var(--dd-sep, #f1f5f9); margin: 1px 10px; }
        @keyframes hdd-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .hdd-row, .hdd-ico, .hdd-track, .hdd-thumb { animation: none; transition: none; }
        }
      `}</style>

      <button
        type="button"
        ref={toggle}
        className="hdd-toggle"
        aria-label="Help"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp size={17} aria-hidden="true" />
      </button>

      {open && (
        <div className="hdd-pop" id={panelId} data-align={align}>
          <div className="hdd-head">Help</div>
          <div className="hdd-panel">
            <button type="button" className="hdd-row" disabled={!hasIntro} onClick={takeTour}>
              <span className="hdd-ico" style={{ background: "var(--dd-blue-bg, #eff6ff)" }}>
                <Compass size={17} style={{ color: "var(--dd-blue, #2563eb)" }} aria-hidden="true" />
              </span>
              <span className="hdd-text">
                <span className="hdd-title">Take a tour of this page</span>
                <span className="hdd-desc">{hasIntro ? "A short walk-through of what is here" : "No intro for this page yet"}</span>
              </span>
            </button>
            <div className="hdd-line" />
            <button
              type="button"
              className="hdd-row"
              role="switch"
              aria-checked={autoStartEnabled}
              onClick={() => setAutoStartEnabled(!autoStartEnabled)}
            >
              <span className="hdd-ico" style={{ background: "var(--dd-violet-bg, #f5f3ff)" }}>
                <Sparkles size={17} style={{ color: "var(--dd-violet, #8b5cf6)" }} aria-hidden="true" />
              </span>
              <span className="hdd-text">
                <span className="hdd-title">Show intro on new pages</span>
                <span className="hdd-desc">{autoStartEnabled ? "On — first visit to a page starts its intro" : "Off — use this menu to start one"}</span>
              </span>
              <span className="hdd-track" data-on={String(autoStartEnabled)} aria-hidden="true">
                <span className="hdd-thumb" />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
