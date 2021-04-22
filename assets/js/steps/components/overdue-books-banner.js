/**
 * @file
 * OverdueBooksBanner component.
 *
 * Displays a banner with items that are overdue.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { StatusBannerHeaderOverdueBooks } from "../utils/formatted-messages";

/**
 * OverdueBooksBanner.
 *
 * @param item
 *   Item to be displayed by the banner components
 *
 * @return {*}
 * @constructor
 */
function OverdueBooksBanner({ items }) {
    let classes = ['overdue-books-banner', 'danger'];

    let icon = faExclamationTriangle;

    const classNames = classes.join(' ');

    return (
        <div className={classNames}>
            <div className={'top'}>
                <span className={'header'}>
                    {icon && <FontAwesomeIcon icon={icon} size={'lg'} className={'mr-2'} />}
                    {StatusBannerHeaderOverdueBooks(items.length)}
                </span>
            </div>
            <div className={'items mt-2'}>
                {items && items.map((item) => (
                    <div className={'item mb-2'} key={'overdueItem' + (item.id || item.itemIdentifier)}>
                        {item.title && <div className='title'>{item.title}</div>}
                        {item.author &&
                            <span className='author'>Af {item.author}</span>
                        }
                        {!item.author &&
                            <span className='author'>Uden forfatter</span>
                        }
                    </div>
                ))}
            </div>
        </div>
    );
}

OverdueBooksBanner.propTypes = {
    items: PropTypes.array.isRequired
};

export default OverdueBooksBanner;
