import React from 'react';

import {stylesContainer} from './app.module.less';
import {stylesHeader} from './app.module.scss';
import {validateAndParseAddress} from '@convexus/sdk-core';

export const App = (): React.ReactElement => (
    <div className={stylesContainer}>
        <div className={stylesHeader}>It works</div>
        <div>{validateAndParseAddress('test')}</div>
    </div>
);
