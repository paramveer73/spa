import { createSelector, createSlice } from "@reduxjs/toolkit";
import { buildMenu } from "@/data/catalog";

/**
 * The bookable menu, as the `catalog` listener (useCatalog) last delivered it.
 *
 * Held flat — categories, services, policies — exactly as normalizeCatalog
 * returns it; the nested menu the booking page renders is derived by
 * selectMenu. The store key stays `services`, matching the arthalaw app this
 * slice was ported from; its old add/remove-by-name reducers had no callers.
 */
const initialState = {
  categories: [],
  services: [],
  policies: null,
  // Distinguishes "still loading" from "the menu is genuinely empty".
  loaded: false,
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    // Replaces the lot: every delivery is the whole node, so there's nothing to merge.
    setCatalog: (state, action) => ({ ...action.payload, loaded: true }),
  },
});

export const { setCatalog } = servicesSlice.actions;

export const selectCatalogCategories = (state) => state.services.categories;
export const selectCatalogServices = (state) => state.services.services;
export const selectBookingPolicies = (state) => state.services.policies;
export const selectCatalogLoaded = (state) => state.services.loaded;

/** Memoised, so the menu is rebuilt only when the catalog changes, not on every cart update. */
export const selectMenu = createSelector([selectCatalogCategories, selectCatalogServices], (categories, services) =>
  buildMenu({ categories, services }),
);

export default servicesSlice.reducer;
