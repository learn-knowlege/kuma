//@flow
import * as React from 'react';
import { memo, useContext, useEffect, useMemo, useState, useRef } from 'react';

import GAProvider from '../ga-provider.jsx';

import { gettext } from '../l10n.js';
import type { DocumentData } from '../document.jsx';

type Props = {
    documentData: ?DocumentData,
    locale: string,
};

// To avoid problems with flow and React.memo(), define the component
// in this plain way first. See bottom of file for the final memo() and export.
const _MainMenu = ({ documentData, locale }: Props) => {
    const mainMenuToggleRef = useRef(null);
    const previousActiveElementRef = useRef(null);
    const [showMainMenu, setShowMainMenu] = useState(false);
    const [showSubMenu, setShowSubMenu] = useState(null);
    const ga = useContext(GAProvider.context);

    /**
     * Send a signal to GA when there is an interaction on one
     * of the main menu items.
     * @param {Object} event - The event object that was triggered
     */
    function sendMenuItemInteraction(event) {
        const label = event.target.href || event.target.textContent;

        ga('send', {
            hitType: 'event',
            eventCategory: 'Wiki',
            eventAction: 'MainNav',
            eventLabel: label,
        });
    }

    function hideSubMenuIfVisible() {
        if (showSubMenu) {
            setShowSubMenu(false);
        }
    }

    function toggleMainMenu() {
        const pageOverlay = document.querySelector('.page-overlay');
        let mainMenuButton = mainMenuToggleRef.current;

        if (mainMenuButton) {
            mainMenuButton.classList.toggle('expanded');
            setShowMainMenu(!showMainMenu);
        }

        if (pageOverlay) {
            pageOverlay.classList.toggle('hidden');
        }
    }

    /**
     * Show and hide submenus in the main menu, send GA events and updates
     * the ARIA state.
     * @param {Object} event - onClick event triggered on top-level menu item
     * @param {String} menuLabel - The current top-level menu item label
     */
    function toggleSubMenu(event, menuLabel) {
        const expandedState = showSubMenu === menuLabel ? false : true;

        // store the current activeElement
        previousActiveElementRef.current = event.target;
        event.target.setAttribute('aria-expanded', expandedState);

        setShowSubMenu(showSubMenu === menuLabel ? null : menuLabel);
        sendMenuItemInteraction(event);
    }

    useEffect(() => {
        document.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                hideSubMenuIfVisible();
                if (previousActiveElementRef.current) {
                    previousActiveElementRef.current.focus();
                }
            }
        });

        document.addEventListener('click', (event: MouseEvent) => {
            if (
                event.target &&
                event.target instanceof HTMLElement &&
                !event.target.classList.contains('top-level-entry')
            ) {
                hideSubMenuIfVisible();
            }
        });
    });

    // The menus array includes objects that define the set of
    // menus displayed by this header component. The data structure
    // is defined here during rendering so that the gettext() calls
    // happen after the string catalog is available. And we're using
    // useMemo() so that localization only happens when the locale
    // changes.
    const menus = useMemo(
        () => [
            {
                label: gettext('Technologies'),
                labelId: 'technologies',
                items: [
                    {
                        url: `/${locale}/docs/Web`,
                        label: gettext('Technologies Overview'),
                    },
                    {
                        url: `/${locale}/docs/Web/HTML`,
                        label: gettext('HTML'),
                    },
                    {
                        url: `/${locale}/docs/Web/CSS`,
                        label: gettext('CSS'),
                    },
                    {
                        url: `/${locale}/docs/Web/JavaScript`,
                        label: gettext('JavaScript'),
                    },
                    {
                        url: `/${locale}/docs/Web/Guide/Graphics`,
                        label: gettext('Graphics'),
                    },
                    {
                        url: `/${locale}/docs/Web/HTTP`,
                        label: gettext('HTTP'),
                    },
                    {
                        url: `/${locale}/docs/Web/API`,
                        label: gettext('APIs / DOM'),
                    },
                    {
                        url: `/${locale}/docs/Mozilla/Add-ons/WebExtensions`,
                        label: gettext('Browser Extensions'),
                    },
                    {
                        url: `/${locale}/docs/Web/MathML`,
                        label: gettext('MathML'),
                    },
                ],
            },
            {
                label: gettext('References & Guides'),
                labelId: 'references-guides',
                items: [
                    {
                        url: `/${locale}/docs/Learn`,
                        label: gettext('Learn web development'),
                    },
                    {
                        url: `/${locale}/docs/Web/Tutorials`,
                        label: gettext('Tutorials'),
                    },
                    {
                        url: `/${locale}/docs/Web/Reference`,
                        label: gettext('References'),
                    },
                    {
                        url: `/${locale}/docs/Web/Guide`,
                        label: gettext('Developer Guides'),
                    },
                    {
                        url: `/${locale}/docs/Web/Accessibility`,
                        label: gettext('Accessibility'),
                    },
                    {
                        url: `/${locale}/docs/Games`,
                        label: gettext('Game development'),
                    },
                    {
                        url: `/${locale}/docs/Web`,
                        label: gettext('...more docs'),
                    },
                ],
            },
            {
                label: gettext('Feedback'),
                labelId: 'feedback',
                items: [
                    {
                        url: `/${locale}/docs/MDN/Feedback`,
                        label: gettext('Send Feedback'),
                    },
                    {
                        url: 'https://support.mozilla.org/',
                        label: gettext('Get Firefox help'),
                        external: true,
                    },
                    {
                        url: 'https://stackoverflow.com/',
                        label: gettext('Get web development help'),
                        external: true,
                    },
                    {
                        url: `/${locale}/docs/MDN/Contribute`,
                        label: gettext('Contribute to MDN'),
                    },
                    {
                        label: gettext('Report a content problem'),
                        external: true,
                        url:
                            'https://github.com/mdn/sprints/issues/new?template=issue-template.md&projects=mdn/sprints/2&labels=user-report&title={{PATH}}',
                    },
                    {
                        label: gettext('Report an issue'),
                        external: true,
                        url: 'https://github.com/mdn/kuma/issues/new/choose',
                    },
                ],
            },
        ],
        [locale]
    );

    // One of the menu items has a URL that we need to substitute
    // the current document path into. Compute that now, if possible.
    // In SPAs (e.g. the home page) there is no `documentData` but the
    // useEffect below will take care of it anyway.
    const [currentAbsoluteUrl, setCurrentAbsoluteUrl] = useState(
        documentData ? documentData.absoluteURL : ''
    );
    useEffect(() => {
        setCurrentAbsoluteUrl(window.location.href);
    }, []);

    return (
        <nav className="main-nav" aria-label="Main menu">
            <button
                ref={mainMenuToggleRef}
                type="button"
                className="ghost main-menu-toggle"
                aria-haspopup="true"
                aria-label="Show Menu"
                onClick={toggleMainMenu}
            />
            <ul className={`main-menu ${showMainMenu ? 'show' : ''}`}>
                {menus.map((menuEntry) => (
                    <li
                        key={menuEntry.label}
                        className="top-level-entry-container"
                    >
                        <button
                            id={`${menuEntry.labelId}-button`}
                            type="button"
                            className="top-level-entry"
                            aria-haspopup="true"
                            aria-expanded="false"
                            onClick={(event) => {
                                toggleSubMenu(event, menuEntry.label);
                            }}
                        >
                            {menuEntry.label}
                        </button>
                        <ul
                            className={
                                menuEntry.label === showSubMenu ? 'show' : null
                            }
                            role="menu"
                            aria-labelledby={`${menuEntry.labelId}-button`}
                        >
                            {menuEntry.items.map((item) => (
                                <li
                                    key={item.url}
                                    data-item={menuEntry.label}
                                    role="none"
                                >
                                    {item.external ? (
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href={item.url.replace(
                                                '{{PATH}}',
                                                currentAbsoluteUrl
                                            )}
                                            onClick={sendMenuItemInteraction}
                                            onContextMenu={
                                                sendMenuItemInteraction
                                            }
                                            role="menuitem"
                                        >
                                            {item.label} &#x1f310;
                                        </a>
                                    ) : (
                                        <a
                                            href={item.url}
                                            onClick={sendMenuItemInteraction}
                                            onContextMenu={
                                                sendMenuItemInteraction
                                            }
                                            role="menuitem"
                                        >
                                            {item.label}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const MainMenu = memo<Props>(_MainMenu);
export default MainMenu;
