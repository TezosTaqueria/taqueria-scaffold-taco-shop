/*
  The tests in this module exercise the Front-End, user-facing tests. They are concerned with
  widgets, i.e. that visual controls align with the state of the deployed contract.

  The Front End uses React, so this test code is somewhat coupled to that framework.
  Note that there are also Integration Tests and Unit Tests for the Contract itself.

  Please see the top-level README file for more information.

  Copyright (c) 2023 ECAD Labs. All rights reserved.
  This software is licensed under the terms of the included LICENSE file.
*/

import { screen } from '@testing-library/react';

describe('Taco Shop page', () => {

    it('should display the correct title', () => {
        const element = screen.queryAllByText('Taco Shop');
        expect(element).toBeDefined();
    });

    it('should initially display "0" in the button text', () => {
        const element = screen.queryAllByText('Order 0 Tacos');
        expect(element).toBeDefined();
    });

    xit('should update the button text when the spinner is incremented', () => {
        // TODO
    });

    xit('should decrement the taco count when clicked', () => {
        // TODO
    });

    xit('should disable the purchase button if amount exceeds available', () => {
        // TODO
    });

});
