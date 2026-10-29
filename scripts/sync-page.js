const marked = require('marked');

const url = process.env.BOOKSTACK_URL;
const action = process.env.EVENT_ACTION;
const number = process.env.ISSUE_NUMBER;
const title = process.env.ISSUE_TITLE;
const body = process.env.ISSUE_BODY || 'Нет описания';
const issueUrl = process.env.ISSUE_URL;

const headers = {
  'Authorization': 'Token ' + process.env.BOOKSTACK_API_ID + ':' + process.env.BOOKSTACK_API_SECRET,
  'Content-Type': 'application/json',
  'bypass-tunnel-reminder': '1'
};

const pageName = title + ' (#' + number + ')';

let status = 'Открыта';
if (action === 'closed') {
  status = 'Закрыта, знание проверено';
}

const html = '<p><strong>Связанная задача:</strong> <a href="' + issueUrl + '">' + issueUrl + '</a></p>' +
  '<p><strong>Статус задачи:</strong> ' + status + '</p>' +
  marked.parse(body);

async function findPageId() {
  const filter = encodeURIComponent('%(#' + number + ')%');
  const response = await fetch(url + '/api/pages?filter[name:like]=' + filter, { headers: headers });
  const result = await response.json();
  if (result.data && result.data.length > 0) {
    return result.data[0].id;
  }
  return null;
}

async function main() {
  const pageId = await findPageId();
  let response;

  if (pageId === null) {
    const newPage = {
      book_id: Number(process.env.BOOKSTACK_BOOK_ID),
      name: pageName,
      html: html
    };
    response = await fetch(url + '/api/pages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(newPage)
    });
  } else {
    const changes = { name: pageName, html: html };
    response = await fetch(url + '/api/pages/' + pageId, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(changes)
    });
  }

  if (!response.ok) {
    console.error('Ошибка BookStack:', response.status, await response.text());
    process.exit(1);
  }
  console.log('Страница обработана успешно, действие: ' + action);
}

main();
