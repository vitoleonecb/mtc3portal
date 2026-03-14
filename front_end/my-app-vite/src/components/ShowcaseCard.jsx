import React from 'react';
import { ClockIcon, LocationIcon } from '../Icons.jsx';
import { WhenWhereRow } from '../Buttons.jsx';
import { format } from 'date-fns';

/**
 * Pure display card for a showcase event.
 * Wrap in a <Link> externally to make it clickable.
 *
 * Props:
 *   showcase   – showcase object (or preview object)
 *   decoration – optional decoration element (same as WorkshopCard)
 */
export function ShowcaseCard({ showcase, decoration }) {
    if (!showcase) return null;

    let dateLabel = '—';
    if (showcase.showcase_date) {
        try { dateLabel = format(new Date(showcase.showcase_date), "EEEE 'at' h:mm a | MM-dd-yyyy"); }
        catch { dateLabel = String(showcase.showcase_date); }
    }

    return (
        <div className="workshopCardContainer">
            {decoration}
            <div>
                <h1 className="workshopCardName">{showcase.showcase_name || '—'}</h1>
                <WhenWhereRow icon={<ClockIcon size={14} />} label={dateLabel} />
                {showcase.showcase_location && (
                    <WhenWhereRow icon={<LocationIcon size={14} />} label={showcase.showcase_location} />
                )}
                {showcase.showcase_description && (
                    <span id="workshopCardDescription">{showcase.showcase_description}</span>
                )}
            </div>
        </div>
    );
}
