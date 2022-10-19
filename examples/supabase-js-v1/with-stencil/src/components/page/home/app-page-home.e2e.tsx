import { newE2EPage } from '@stencil/core/testing';

describe('app-page-home', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<app-page-home></app-page-home>');
    const element = await page.find('app-page-home');
    expect(element).toHaveClass('hydrated');
  });
});
