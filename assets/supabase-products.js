// supabase-products.js
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The "type" slug matches a column value in your products table, e.g. products.category = 'perfume-sprays'
const CATEGORY_SLUG = document.body.dataset.category;

const grid = document.getElementById("productGrid");
const resultCount = document.getElementById("resultCount");
const sortSelect = document.getElementById("sortSelect");

function renderSkeleton(count = 8) {
    grid.innerHTML = Array.from({ length: count })
        .map(
            () => `
        <div class="product-card">
            <div class="product-img">Loading…</div>
            <div class="product-info">
                <h4>&nbsp;</h4>
                <span class="product-price">&nbsp;</span>
            </div>
        </div>`
        )
        .join("");
}

function renderProducts(products) {
    if (!products.length) {
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--text-muted); padding:40px 0;">
            No products found in this category yet.
        </p>`;
        resultCount.textContent = "0";
        return;
    }

    resultCount.textContent = products.length;

    grid.innerHTML = products
        .map(
            (p) => `
        <a class="product-card" href="product.html?id=${p.id}">
            <div class="product-img">
                ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">` : "Product Image"}
            </div>
            <div class="product-info">
                <h4>${p.name}</h4>
                <span class="product-price" data-price-gbp="${p.price_gbp}">£${Number(p.price_gbp).toFixed(2)}</span>
            </div>
        </a>`
        )
        .join("");

    // re-apply currency conversion to freshly rendered prices
    if (typeof applyCurrentCountry === "function") applyCurrentCountry();
}

async function loadProducts(sort = "featured") {
    renderSkeleton();

    let query = supabaseClient
        .from("products")
        .select("id, name, price_gbp, image_url, created_at, featured_rank")
        .eq("category", CATEGORY_SLUG);

    switch (sort) {
        case "price-asc":
            query = query.order("price_gbp", { ascending: true });
            break;
        case "price-desc":
            query = query.order("price_gbp", { ascending: false });
            break;
        case "newest":
            query = query.order("created_at", { ascending: false });
            break;
        default:
            query = query.order("featured_rank", { ascending: true, nullsFirst: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase error:", error);
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:#e8593a; padding:40px 0;">
            Couldn't load products. Please try again later.
        </p>`;
        return;
    }

    renderProducts(data);
}

sortSelect?.addEventListener("change", (e) => loadProducts(e.target.value));

loadProducts();