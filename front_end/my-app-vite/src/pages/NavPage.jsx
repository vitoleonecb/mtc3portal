import React, { useMemo } from "react";
import { MainNavCard } from "../Buttons.jsx";
import { RAW_CHARACTERS } from "../components/card-characters.jsx";
import { createRng, pickFrom } from "../utils/random.js";
import { useLocation } from "react-router-dom";

export function NavPage() {

    const { key: locationKey } = useLocation();

    const navItems = useMemo(() => ([
        { id: "showcases",     text: "Showcases",     link: "/showcases",     color: "#994242" },
        { id: "membership",    text: "Membership",    link: "/membership",    color: "#D2A478" },
        { id: "analytics",     text: "Analytics",     link: "/analytics",     color: "#D2A478" },
        { id: "documentation", text: "Documentation", link: "/documentation", color: "#57A15E" },
        { id: "home",          text: "Home",          link: "/",             color: "#D9D9D9" },
        { id: "account",       text: "Account",       link: "/settings",      color: "#D9D9D9" },
        { id: "contact",       text: "Contact",       link: "/contact",       color: "#D9D9D9" },
    ]), []);

    const placements = [
      "cardDecoration-top-right",
      "cardDecoration-top-left",
      "cardDecoration-edge-right",
      "cardDecoration-edge-left",
    ];

    const decoratedNavItems = useMemo(() => {
      return navItems.map((item) => {
        const rng = createRng(`nav-${item.id}-${locationKey}`);
        const DECORATION_PROB = 0.35; // about 1 in 3 cards gets a character

        let decoration = null;
        if (rng() < DECORATION_PROB) {
          const placement = pickFrom(rng, placements);
          const RawChar = pickFrom(rng, RAW_CHARACTERS);
          if (placement && RawChar) {
            const bigChance = 0.1;
            let scale;
            if (rng() < bigChance) {
              const t = rng();
              scale = 1.2 + t * 0.8; // larger hero
            } else {
              const t = rng();
              scale = 0.4 + t * 0.6; // mostly small/medium
            }

            decoration = (
              <div
                className={`cardDecoration ${placement}`}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                }}
              >
                <RawChar />
              </div>
            );
          }
        }

        return { ...item, decoration };
      });
    }, [navItems, locationKey]);

    return (
        <>
            <div className='navOptions'>
                {decoratedNavItems.map((item) => (
                  <MainNavCard
                    key={item.id}
                    text={item.text}
                    link={item.link}
                    color={item.color}
                    decoration={item.decoration}
                  />
                ))}
            </div>
        </>
    );
}
