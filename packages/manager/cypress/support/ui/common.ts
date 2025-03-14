/* eslint-disable cypress/no-unnecessary-waiting */
import { Method } from 'axios';
import { RouteHandler, RouteMatcher } from 'cypress/types/net-stubbing';
import { deleteAllTestDomains } from '../api/domains';
import { deleteAllTestFirewalls } from '../api/firewalls';
import { deleteAllTestImages } from '../api/images';
import { deleteAllTestLinodes } from '../api/linodes';
import { deleteAllTestClients } from '../api/longview';
import { deleteAllTestNodeBalancers } from '../api/nodebalancers';
import {
  deleteAllTestAccessKeys,
  deleteAllTestBuckets,
} from '../api/objectStorage';
import { deleteAllTestStackscripts } from '../api/stackscripts';
import { deleteAllTestVolumes } from '../api/volumes';

const attempt = (fn, attemptsRemaining, delayBetweenAttemptsMs) => {
  cy.log(`Attempts remaining: ${attemptsRemaining}`);
  if (attemptsRemaining <= 1) {
    return fn(); // last attempt
  }
  try {
    return fn();
  } catch (err) {
    cy.wait(delayBetweenAttemptsMs);
    return attempt(fn, attemptsRemaining - 1, delayBetweenAttemptsMs);
  }
};

// / Wraps an Action of type ()=>void to make ot more stable
// / Tries Multiple Time, wiats before, and between attempts
export const defensiveDo = (
  getFunction,
  attemptsNumber = 5,
  waitBeforeTryMs = 300,
  delayBetweenAttemptsMs = 300
) => {
  cy.wait(waitBeforeTryMs);
  attempt(getFunction, attemptsNumber, delayBetweenAttemptsMs);
};

export const waitForAppLoad = (path = '/', withLogin = true) => {
  cy.intercept('GET', '*/linode/instances/*').as('getLinodes');
  cy.intercept('GET', '*/account').as('getAccount');
  cy.intercept('GET', '*/profile').as('getProfile');
  cy.intercept('GET', '*/account/settings').as('getAccountSettings');
  cy.intercept('GET', '*/profile/preferences').as('getProfilePreferences');
  cy.intercept('GET', '*/account/notifications**').as('getNotifications');

  withLogin ? cy.visitWithLogin(path) : cy.visit(path);
  cy.wait('@getLinodes');
  cy.wait('@getAccount');
  cy.wait('@getAccountSettings');
  cy.wait('@getProfilePreferences');
  cy.wait('@getProfile');
  cy.wait('@getNotifications');
};

export const interceptOnce = (
  method: Method,
  url: RouteMatcher,
  response: {}
) => {
  let count = 0;
  return cy.intercept(method, url, (req) => {
    count += 1;
    if (count < 2) {
      req.reply(response);
    }
  });
};

export const getRandomNumber = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const deleteAllTestData = () => {
  deleteAllTestLinodes();
  deleteAllTestNodeBalancers();
  deleteAllTestVolumes();
  deleteAllTestImages();
  deleteAllTestClients();
  deleteAllTestAccessKeys();
  deleteAllTestBuckets();
  deleteAllTestFirewalls();
  deleteAllTestStackscripts();
  deleteAllTestDomains();
};
