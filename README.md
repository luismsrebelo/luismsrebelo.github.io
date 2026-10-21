# Luis Rebelo - Personal Website

This repository contains the source for [luismsrebelo.github.io](https://luismsrebelo.github.io), built with Jekyll and the [Academic Pages](https://github.com/academicpages/academicpages.github.io) template.

## Customize the site

- Update site details and profile links in `_config.yml`.
- Edit the homepage and CV in `_pages/about.md` and `_pages/cv.md`.
- Add publications, talks, teaching, projects, and posts to `_publications/`, `_talks/`, `_teaching/`, `_portfolio/`, and `_posts/`.
- Add downloadable documents to `files/` and a profile photo to `images/profile.png`.
- Change the header links in `_data/navigation.yml`.

The repository includes the Academic Pages GitHub Actions workflow. In the repository settings, set **Settings > Pages > Build and deployment > Source** to **GitHub Actions** to publish the site.

## Preview locally

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll serve -l -H localhost
```

Open `http://localhost:4000` to preview the site.

## Attribution

Academic Pages is distributed under the MIT License; see [LICENSE](LICENSE).
