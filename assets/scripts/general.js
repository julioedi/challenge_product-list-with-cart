(async () => {
    const wait = async (time = 0.4) => {
        await new Promise(res => {
            setTimeout(() => {
                res(true);
            }, time * 1000)
        })
    }
    const products = await fetch("./data.json").then(res => res.json());

    /**
     * @param {object|null} props;
     * @returns {HTMLDivElement}
     */
    const element = (html = "", props = null, nodeName = "div") => {
        const el = document.createElement(nodeName);
        el.innerHTML = html;
        if (props) {
            for (const key in props) {
                if (key != "innerHTML") {
                    el[key] = props[key]
                }
            }
        }
        return el;
    }

    const form = document.querySelector("form");
    const formContent = form.querySelector(".content");

    const list = document.getElementById("products");
    const itemslist = document.getElementById("itemslist");
    const itemsContent = itemslist.querySelector(".content");
    const prices = itemslist.querySelector(".info .total");

    const data = {
        current: [],
        products: [],
        render: () => { }
    };

    const getTotal = () => {
        let total = 0;
        let totalPrices = 0;
        data.current.forEach(item => {
            if (!data.current.includes(item)) {
                return
            }
            total = data.products[item].total + total;
            totalPrices = data.products[item].total * data.products[item].price
        });
        return [total, totalPrices];
    }

    data.render = () => {
        const [products, finalprice] = getTotal();
        itemslist.setAttribute("data-total", products);
        prices.innerHTML = "$ " + finalprice.toFixed(2);

        formContent.setAttribute("data-total", "$ " + finalprice.toFixed(2));
        data.current.forEach(async (index) => {
            const element = data.products[index];
            const { cartInfo, finalInfo } = element;
            if (finalInfo.parentElement != formContent) {
                formContent.appendChild(finalInfo);
                await wait(0.05);
                finalInfo.removeAttribute("data-index");
            }
            if (cartInfo.parentElement != itemsContent) {
                itemsContent.appendChild(cartInfo);
                await wait(0.05);
                cartInfo.removeAttribute("data-index");
            }
        });
        data.products.forEach(async (element, index) => {
            if (data.current.includes(index)) {
                return;
            }
            const { cartInfo, virtual, finalInfo } = element;
            cartInfo.setAttribute("data-index", "null");
            if (finalInfo.parentElement == formContent) {
                virtual.appendChild(finalInfo);
            }
            if (cartInfo.parentElement == itemsContent) {
                await wait(0.3).then(() => {
                    if (cartInfo.parentElement == itemsContent && element.total == 0) {
                        virtual.appendChild(cartInfo);
                    }
                })
            }

        })
    }

    /**
     * Renders an props.
     * 
     * @param {Object} props - The props to render.
     * @param {string} props.name - Name of the props.
     * @param {string} props.category - Category of the props.
     * @param {number} props.price - Price of the props.
     * @param {Object} props.image - Images for different screen sizes.
     * @param {string} props.image.thumbnail - Thumbnail image path.
     * @param {string} props.image.mobile - Mobile image path.
     * @param {string} props.image.tablet - Tablet image path.
     * @param {string} props.image.desktop - Desktop image path.
     */
    const renderItem = (props, index) => {
        let i = index;
        const item = element("", null, "article");
        item.className = "single_item";
        const img = `<img src="${props.image.mobile}" alt="${props.name}" srcset="${props.image.mobile} 480w,  ${props.image.tablet} 768w, ${props.image.desktop} 1024w">`;
        const imageWrap = element(img, { className: "image_wrap" });

        item.appendChild(imageWrap);
        const info = element(`
            <p class="category">${props.category}</p>
            <h2>${props.name}</h2>
            <p class="price">$${props.price.toFixed(2)}</p>
            `,
            {
                className: "product_info"
            }
        );

        const currentElement = {
            total: 0,
            price: props.price,
            index: i,
            add: () => { },
            remove: () => { },
            virtual: element(),
            cartInfo: null,
            finalInfo: null,
            editable: null,
        }
        const empty = '<div class="inner add_element"><span class="cart"></span><span class="no_product">Add to cart</span></div>';
        const addRemove = element(empty, { className: "add_remove" });
        const totalView = element(`<span class="substract action">-</span><input min="0" class="total" value="${currentElement.total}" type="number"><span class="add_element action">+</span>`, { className: "inner filled" });
        currentElement.virtual.appendChild(totalView);
        const buttonTotal = totalView.querySelector(".total");
        buttonTotal.addEventListener("input", (e) => {
            const {valueAsNumber} = e.target;
            if (!valueAsNumber) {
                e.target.value = currentElement.total;
            }else{
                currentElement.total = valueAsNumber;
                updateCartInfo();
                data.render();
            }

        })

        const updated = () => {
            if (currentElement.total < 1 && totalView.parentNode !== currentElement.virtual) {
                currentElement.virtual.appendChild(totalView);
                addRemove.innerHTML = empty;
                return;
            }
            else if (currentElement.total > 0 && totalView.parentNode === currentElement.virtual) {
                addRemove.innerHTML = "";
                addRemove.appendChild(totalView);
            }
            buttonTotal.value = currentElement.total;
        }
        addRemove.addEventListener("click", (e) => {
            const is_remove = e.target?.closest(".substract");
            const is_add = e.target?.closest(".add_element");
            if (is_remove) {
                currentElement.remove()
            }
            else if (is_add) {
                currentElement.add();
            }
        });

        const genrateInfo = (prevent = false) => {
            const qty = element(currentElement.total + "x", { className: "qty" });
            const price = element(`@ $${props.price.toFixed(2)}`, null, "span");
            const totalPrice = element(`$${props.price * currentElement.total}`, { className: "total_price" }, 'span');
            const info = element(`<div class="name">${props.name}</div>`, { className: "infoitem" });
            info.appendChild(qty);
            info.appendChild(price);
            info.appendChild(totalPrice);
            if (!prevent) {
                const removeInfo = element('<span class="action"></span>', { className: "close" });
                removeInfo.addEventListener("click", () => {
                    currentElement.total = 0;
                    currentElement.remove(true);
                })
                info.appendChild(removeInfo);
                info.setAttribute("data-index", "null");
            }
            info["_updateCartInfo"] = () => {
                const total = currentElement.total < 1 ? 1 : currentElement.total;
                totalPrice.innerHTML = `$${(props.price * total).toFixed(2)}`;
                qty.innerHTML = total + "x";
            }
            return info;
        }
        const cartInfo = genrateInfo();
        const finalInfo = element(`<input type="number" hidden name="product[${props.name}]" value="0"><img src="${props.image.thumbnail}">`, { className: "form_item_info" });
        const finalInfoData = genrateInfo(true);
        finalInfo.appendChild(finalInfoData);
        currentElement.cartInfo = cartInfo;

        currentElement.finalInfo = finalInfo;

        const updateCartInfo = () => {
            cartInfo._updateCartInfo();
            finalInfoData._updateCartInfo();
        }


        // itemsContent.appendChild(cartInfo)
        let added = false;
        currentElement.add = async () => {
            currentElement.total++;
            updated();
            if (!data.current.includes(i)) {
                data.current.push(i);
            }
            updateCartInfo()
            data.render();
        }

        currentElement.remove = async (preventupdate = false) => {
            currentElement.total = currentElement.total - 1;
            if (currentElement.total < 0) {
                currentElement.total = 0;
            }
            updated();
            if (currentElement.total == 0) {
                data.current = data.current.filter(itemIndex => itemIndex != i);
            }
            if (!preventupdate) {
                updateCartInfo()
            }
            data.render();
        }

        item.appendChild(addRemove);
        data.products[i] = currentElement;
        item.appendChild(info);
        list.appendChild(item);
    }


    products.forEach(renderItem);


    const firstSubmit = document.querySelector(".ordersubmit");

    const modal = document.getElementById("modal");
    // const modalbkg = modal.querySelector(".bkg");
    const closeModal = () => {
        data.products.forEach(item => {
            item.total = 0;
            item.remove(true);
        })
        modal.classList.remove("active");
    }
    const openModal = () => {
        const total = getTotal();
        if (total < 1) {
            return;
        }
        modal.classList.add("active");
    }
    firstSubmit.addEventListener("click", openModal);
    // modalbkg.addEventListener("click", closeModal);
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        closeModal();
    })
})()