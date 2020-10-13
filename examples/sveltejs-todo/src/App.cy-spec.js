// import {internal} from 'svelte'
// import svelte from 'svelte'
import { mount } from 'cypress-svelte-unit-test'
import App from './App.svelte'

/* global cy */
describe(App.name, () => {
  it('can test', () => {
    assert(true === true)
  })
  it('can be instantiated', () => {
    return new App({
      target: document.body,
    })
  })
  it('should render component', () => {
    mount(App)
    cy.contains('Logout')
  })
})
