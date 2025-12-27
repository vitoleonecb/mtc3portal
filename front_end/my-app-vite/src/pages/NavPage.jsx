import React from "react";
import { MainNavCard } from "../Buttons.jsx";

export function NavPage() {
    
    return (
        <>
            <div className='navOptions'>
                <MainNavCard text="Workshops" link="/workshops" color="#994242"/>
                <MainNavCard text="Analytics" link="/analytics" color="#D2A478"/>
                <MainNavCard text="Documentation" link="/documentation" color="#57A15E"/>
                <MainNavCard text="Home" link="/" color="#D9D9D9"/>
                <MainNavCard text="Account" link="/settings" color="#D9D9D9"/>
                <MainNavCard text="Contact" link="/contact" color="#D9D9D9"/>
            </div>
        </>
    )
}