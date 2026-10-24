# TJ Interiors Ltd — website

A static website (plain HTML, CSS and a little JavaScript, with no build step). It works on GitHub Pages or any web host.

## Files

| File | Page |
|---|---|
| `index.html` | Home (with the slider) |
| `about.html`, `services.html`, `showroom.html`, `gallery.html`, `contact.html` | Main pages |
| `curtains.html`, `blinds.html`, `shutters.html`, `carpets.html`, `engineered-wood.html`, `laminate.html`, `luxury-vinyl-tiles.html`, `sheet-vinyl.html`, `accessories.html` | Service pages |
| `css/site.css` | Shared styles (the home page has its own styles inside `index.html`) |
| `js/site.js` | Slider, mobile menu, gallery filter, forms |
| `images/` | All photos |

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `tj-interiors`).
2. Click **Add file → Upload files**. Drag in **everything inside this folder** (the `.html` files plus the `css`, `js` and `images` folders), not the folder itself, so `index.html` sits at the top level. Commit.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, pick `main` and `/ (root)`, then click **Save**.
4. After a minute or two, the site is live at `https://YOUR-USERNAME.github.io/tj-interiors/`.

To use **tjinteriors.org.uk**, add it under *Settings → Pages → Custom domain*, then update the domain's DNS records as GitHub explains on that page.

## Make the booking forms send emails

The forms on the home page and the contact page post to [Formspree](https://formspree.io), which is free for low volumes.

1. Sign up at formspree.io with tjinteriors@hotmail.co.uk and create a form.
2. Copy your form ID (it looks like `xyzabcde`).
3. In `index.html` and `contact.html`, search for `YOUR_FORM_ID` and replace it with your ID.

Until you do this, the forms show the thank-you message but send nothing.

## Still to update

- Opening times on the home page: search for `[OPENING TIMES]` in `index.html`.
- Facebook, Instagram and Checkatrade links currently go to each site's home page. Search for `facebook.com`, `instagram.com` and `checkatrade.com` and paste in your own profile links.
- The Privacy policy and Terms & conditions links (`#privacy`, `#terms`) need their own pages.
