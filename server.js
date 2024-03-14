const express = require('express');
const cheerio = require('cheerio');
const { url, port } = require('./config.json');

const app = express();
app.use(express.json());

app.get('/search', function(req, res) {
	async function fetchSearchResults() {
		const inputValue = req.query.searchQuery;
		const resList = {};

		const initSearch = await fetch(
			`https://app.thestorygraph.com/browse?search_term=${inputValue}`,
		);
		const srPage = await initSearch.text();
		const srPageBody = cheerio.load(srPage);

		const book_id = srPageBody('.book-pane').data('book-id');
		resList.url = `https://app.thestorygraph.com/books/${book_id}`;
		const response = await fetch(
			resList.url,
		);
		const body = await response.text();
		const $ = cheerio.load(body);

		const generalInfo = $('.book-title-author-and-series');
		resList.title = generalInfo.find('h3').eq(0).text().split('\n')[0].trim();
		resList.series = generalInfo.find('p').eq(0).text().trim();
		resList.author = generalInfo.find('p').eq(1).text().trim();

		resList.cover = $('.book-cover img').attr('src');

		const extraInfo = generalInfo.next().eq(0);
		resList.pages = extraInfo.text().split('pages')[0].trim();
		resList.publishDate = extraInfo.find('span').text().split('pub')[1].split('•')[0].trim();

		resList.tags = '';
		$('.book-page-tag-section').eq(0).find('span').each((i, tag) => {
			resList.tags = resList.tags.concat($(tag).text().trim() + ' ');
		});

		// TODO: adjust description size
		resList.description = $('.trix-content').eq(0).text().trim();

		resList.rating = $('.average-star-rating').eq(0).text().trim();

		return resList;
	}
	fetchSearchResults().then((results) => {
		res.send(results);
	});
});

app.listen(port, '0.0.0.0', () => {
	console.log('app listening on port ' + port);
});