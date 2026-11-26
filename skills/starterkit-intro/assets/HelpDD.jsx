"use client";
import { useState } from "react";
import { DropdownItem } from "reactstrap";
import { Compass, Sparkles } from "lucide-react";
import { useIntro } from "@devopsnext/starterkit-intro";

/**
 * From the starterkit-intro skill (assets/HelpDD.jsx): copy it as it is. For a shell whose header dropdowns
 * are reactstrap (@devopsnext/starterkit-layout). Colours are the starterkit-theme --dd-* tokens, with light
 * fallbacks.
 *
 * Header "Help" panel — the one place an end user can replay this page's intro
 * or turn first-visit intros off.
 *
 * Rows are reactstrap <DropdownItem>s on purpose: the layout package renders
 * every headerDropdowns entry inside an UncontrolledDropdown, and a DropdownItem
 * is the only child that closes it on click and joins its arrow-key navigation.
 * A plain <button> would start the tour with the menu still open underneath it.
 *
 * The switch row passes `toggle={false}` so flipping it leaves the panel open —
 * the user should see the state they just set.
 *
 * Only `hasIntro` decides the tour row's state. The menu lives in the header,
 * so on a route with no public/intro file it stays visible and says so.
 */
export default function HelpDD() {
  const { hasIntro, start, autoStartEnabled, setAutoStartEnabled } = useIntro();
  const [hovered, setHovered] = useState(null);

  const rows = [
    {
      id: "tour",
      icon: Compass,
      color: "var(--dd-blue, #2563eb)",
      bg: "var(--dd-blue-bg, #eff6ff)",
      title: "Take a tour of this page",
      desc: hasIntro ? "A short walk-through of what is here" : "No intro for this page yet",
      disabled: !hasIntro,
      /* The tour returns focus to whatever was focused when it started. Left
         alone that is this menu item, which the dropdown hides on click — so
         focus fell to <body>. Hand it to the Help toggle first. */
      onClick: (e) => {
        e.currentTarget.closest(".dropdown")?.querySelector("[aria-expanded]")?.focus();
        start();
      },
    },
    {
      id: "auto",
      icon: Sparkles,
      color: "var(--dd-violet, #8b5cf6)",
      bg: "var(--dd-violet-bg, #f5f3ff)",
      title: "Show intro on new pages",
      desc: autoStartEnabled ? "On — first visit to a page starts its intro" : "Off — use this menu to start one",
      switchOn: autoStartEnabled,
      onClick: () => setAutoStartEnabled(!autoStartEnabled),
    },
  ];

  return (
    <div className="hdd-panel">
      <style>{`
        .hdd-panel { padding: 6px 8px 8px; background: var(--dd-panel-bg, #fff); font-family: var(--font-heading, inherit); }
        .hdd-row {
          display: flex; align-items: center; gap: 11px; width: 100%;
          padding: 9px 10px; border: 0; border-radius: 10px; margin-bottom: 1px;
          background: transparent; text-align: left; cursor: pointer; white-space: normal;
          animation: hdd-in 0.3s ease both;
          transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
        }
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

      {rows.map((row, i) => {
        const Icon = row.icon;
        const on = hovered === row.id && !row.disabled;
        const isSwitch = row.switchOn !== undefined;
        return (
          <div key={row.id}>
            <DropdownItem
              tag="button"
              type="button"
              className="hdd-row"
              disabled={row.disabled}
              toggle={!isSwitch}
              /* No aria-checked: reactstrap hard-codes role="menuitem", on which
                 aria-checked is invalid. The row's text says On/Off instead. */
              onClick={row.onClick}
              onMouseEnter={() => setHovered(row.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                animationDelay: `${i * 0.04 + 0.03}s`,
                background: on ? "var(--dd-hover-bg, #f8fafc)" : "transparent",
                boxShadow: on ? "var(--dd-hover-shadow, 0 2px 12px rgba(0, 0, 0, 0.07))" : "none",
                transform: on ? "translateY(-1px)" : "translateY(0)",
              }}
            >
              <span
                className="hdd-ico"
                style={{
                  background: row.bg,
                  boxShadow: on ? `0 0 0 3px color-mix(in srgb, ${row.color} 12.5%, transparent)` : "none",
                }}
              >
                <Icon size={17} style={{ color: row.color }} aria-hidden="true" />
              </span>
              <span className="hdd-text">
                <span className="hdd-title">{row.title}</span>
                <span className="hdd-desc">{row.desc}</span>
              </span>
              {isSwitch && (
                <span className="hdd-track" data-on={String(row.switchOn)} aria-hidden="true">
                  <span className="hdd-thumb" />
                </span>
              )}
            </DropdownItem>
            {i < rows.length - 1 && <div className="hdd-line" />}
          </div>
        );
      })}
    </div>
  );
}
