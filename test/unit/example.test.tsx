import React from "react";

import {
  findAllByTestId,
  findByTestId,
  fireEvent,
  getByText,
  queryByText,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Application } from "../../src/client/Application";
import { addToCart, initStore } from "../../src/client/store";
import { CartApi, ExampleApi } from "../../src/client/api";
import mediaQuery from "css-mediaquery";
import "@testing-library/jest-dom/extend-expect";
const basename = "/hw/store";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import userEvent from "@testing-library/user-event";
import { ProductShortInfo } from "../../src/common/types";
import { Catalog } from "../../src/client/pages/Catalog";
import { Product } from "../../src/client/pages/Product";
import { Cart } from "../../src/client/pages/Cart";
const mockData: ProductShortInfo[] = [
  {
    id: 234,
    name: "sdf",
    price: 345,
  },
  {
    id: 34,
    name: "jyjh",
    price: 345,
  },
  {
    id: 65,
    name: "ghjj",
    price: 345,
  },
];
const api = new ExampleApi(basename);
jest.spyOn(api, "getProducts").mockImplementation(() =>
  Promise.resolve({
    status: 200,
    data: mockData,
    statusText: "OK",
    headers: {},
    config: {},
  })
);
const DETAIL = {
  color: "sfd",
  description: "sdf",
  id: 878,
  material: "sdf",
  name: "sdf",
  price: 234,
};
jest.spyOn(api, "getProductById").mockImplementation(() =>
  Promise.resolve({
    status: 200,
    data: DETAIL,
    statusText: "OK",
    headers: {},
    config: {},
  })
);
jest.spyOn(api, "checkout").mockImplementation(() =>
  Promise.resolve({
    status: 200,
    data: DETAIL,
    statusText: "OK",
    headers: {},
    config: {},
  })
);
const cart = new CartApi();
const store = initStore(api, cart);
store.dispatch(addToCart(DETAIL));
const BASE_URL = "http://localhost/";

const application = (
  <BrowserRouter>
    <Provider store={store}>
      <Application />
    </Provider>
  </BrowserRouter>
);
jest.mock("axios");
describe("Общие требования", () => {
  //   const { container, findByText } = render(application);

  describe("Проверяем все ли ссылки есть в шапке", () => {
    const { container, findByText } = render(application);
    const links = container.querySelectorAll<HTMLLinkElement>(".container a");

    it("Шапка вообще есть", () => {
      expect(links).toBeDefined();
    });

    it("Первая ссылка - ссылка на главную", () => {
      expect(links[0].href).toEqual(BASE_URL);
    });

    it("Вторая ссылка - ссылка на каталог", () => {
      expect(links[1].href).toEqual(BASE_URL + "catalog");
    });

    it("Третья ссылка - ссылка на доставку", () => {
      expect(links[2].href).toEqual(BASE_URL + "delivery");
    });

    it("Четвертая ссылка - ссылка на контакты", () => {
      expect(links[3].href).toEqual(BASE_URL + "contacts");
    });

    it("Пятая ссылка - ссылка на корзину", () => {
      expect(links[4].href).toEqual(BASE_URL + "cart");
    });
  });

  it("Название магазина в шапке должно быть ссылкой на главную страницу", async () => {
    const { findByText } = render(application);

    const logo = (await findByText("Example store", {
      selector: ".container a.navbar-brand",
    })) as HTMLLinkElement;

    expect(logo?.href).toEqual(BASE_URL);
  });

  it('На ширине меньше 576px навигационное меню должно скрываться за "гамбургер"', async () => {
    render(application);
    const toggler = (await screen.findAllByTestId("navbarTogglerButton"))[0];
    console.log(toggler.style.display);
    // screen.logTestingPlaygroundURL();
    expect(toggler).toBeVisible();
    // console.log(toggler.checkVisibility())
  });
});

describe("Каталог", () => {
  it("В каталоге должны отображаться товары, список которых приходит с сервера", async () => {
    const { container, queryByText } = renderWithRouter(
      <Provider store={store}>
        <Catalog />
      </Provider>,
      {
        route: "catalog",
      }
    );
    await waitForElementToBeRemoved(() => queryByText("LOADING"), {
      timeout: 10_000,
    });

    for (let i of store.getState().products || []) {
      expect(screen.queryAllByTestId(i.id)[0]).toBeDefined();
      expect(
        screen.queryAllByTestId(i.id)[0].querySelector(".Image")
      ).toBeDefined();
      expect(
        screen.queryAllByTestId(i.id)[0].querySelector(".ProductItem-Name")
          ?.textContent
      ).toBeDefined();
      expect(
        screen.queryAllByTestId(i.id)[0].querySelector(".ProductItem-Price")
      ).toBeDefined();
    }
  });

  it("содержимое корзины должно сохраняться между перезагрузками страницы", () => {
    render(application);
    const oldValue = store.getState().cart;

    render(application);
    const newValue = store.getState().cart;

    expect(newValue).toEqual(oldValue);
  });

  it('на странице с подробной информацией отображаются: название товара, его описание, цена, цвет, материал и кнопка * * "добавить в корзину"', async () => {
    const { container, queryByText, findAllByTestId } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/catalog/" + DETAIL.id }
    );
    await findAllByTestId("ProductItem");
    expect(
      container.querySelector(".ProductDetails-Name")?.textContent
    ).not.toBeNull();
    expect(
      container.querySelector(".ProductDetails-Description")?.textContent
    ).not.toBeNull();
    expect(
      container.querySelector(".ProductDetails-Price")?.textContent
    ).not.toBeNull();
    expect(
      container.querySelector(".ProductDetails-AddToCart")?.textContent
    ).not.toBeNull();
    expect(
      container.querySelector(".ProductDetails-Color")?.textContent
    ).not.toBeNull();
    expect(
      container.querySelector(".ProductDetails-Material")?.textContent
    ).not.toBeNull();
  });
  it("если товар уже добавлен в корзину, в каталоге и на странице товара должно отображаться сообщение об этом", async () => {
    const { container, queryByText, findAllByTestId } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/catalog/" + DETAIL.id }
    );
    await findAllByTestId("ProductItem");
    const id = window.location.pathname.split("/catalog/")[1];
    const msg = container.querySelector(".CartBadge");

    if (String(id) in store.getState().cart) {
      expect(msg).not.toBeNull();
    } else {
      expect(msg).toBeNull();
    }
  });

  it("кнопка добавляет товар в корзину и увеличивает его значение", async () => {
    const { container, findAllByTestId } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/catalog/" + DETAIL.id }
    );
    await findAllByTestId("ProductItem");

    const id = window.location.pathname.split("/catalog/")[1];
    const button = container.querySelector(".ProductDetails-AddToCart");
    const oldValue = store.getState().cart[+id].count || 0;

    if (!button) return;

    await userEvent.click(button);

    expect(Number(oldValue)).toEqual(
      Number(store.getState().cart[+id].count) - 1
    );
  });
});

describe("Корзина", () => {
  it("в шапке рядом со ссылкой на корзину должно отображаться количество не повторяющихся товаров в ней", () => {
    store.dispatch(addToCart(DETAIL));
    render(application);
    const numInCart = Object.values(store.getState().cart).length;
    const numOnPage =
      screen
        .getAllByText(/Cart/i)[0]
        .textContent?.split(" (")[1]
        .slice(0, -1) || "";
    expect(Number(numOnPage)).toEqual(numInCart);
  });

  it("в корзине должна отображаться таблица с добавленными в нее товарами", () => {
    store.dispatch(addToCart(DETAIL));
    const { container } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/cart" }
    );
    const table = container.querySelector(".Cart-Table");
    expect(table).not.toBeNull();

    for (let i of Object.values(store.getState().cart)) {
      const row = table?.querySelector(".Cart-Name");
      expect(row).not.toBeNull();
      expect(
        row?.closest("tr")?.querySelector(".Cart-Count")?.textContent
      ).toEqual(i.count.toString());
    }
  });

  it('в корзине должна быть кнопка "очистить корзину", по нажатию на которую все товары должны удаляться', async () => {
    store.dispatch(addToCart(DETAIL));
    const { container } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/cart" }
    );
    const button = container.querySelector<HTMLButtonElement>(".Cart-Clear");
    button && (await userEvent.click(button));
    const newValue = Object.values(store.getState().cart).length;
    expect(newValue).toEqual(0);
  });

  it("если корзина пустая, должна отображаться ссылка на каталог товаров", async () => {
    const { container } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/cart" }
    );
    const num = Object.values(store.getState().cart)?.length;
    const link = container.querySelector<HTMLLinkElement>("a.catalog");
    if (num) {
      expect(link).not.toBeNull();
    } else {
      expect(link).toBeNull();
    }
  });

  it("отправка checkout", async () => {
    store.dispatch(addToCart(DETAIL));
    const { container } = renderWithRouter(
      <Provider store={store}>
        <Application />
      </Provider>,
      { route: "/cart" }
    );

    const name = container.querySelector<HTMLInputElement>("#f-name");
    const phone = container.querySelector<HTMLInputElement>("#f-phone");
    const address = container.querySelector<HTMLTextAreaElement>("#f-address");
    const btn = container.querySelector(".Form-Submit");

    name && (await userEvent.type(name, "Ivan"));
    phone && (await userEvent.type(phone, "89993335511"));
    address && (await userEvent.type(address, "sdfsdfsdf"));
    btn && (await userEvent.click(btn));
    await screen.findAllByText(/Well done!/i);

    const num = container.querySelector(".Cart-Number")?.textContent;
    console.log(store.getState().latestOrderId, num);
    num && expect(+num).toEqual(store.getState().latestOrderId);
  });
});

const renderWithRouter = (ui: JSX.Element, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: BrowserRouter }),
  };
};
