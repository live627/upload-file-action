import { request } from 'http';
import { readFile } from 'fs';

const httpsPost = (options, body) => new Promise((resolve,reject) =>
{
	const req = request(options, res =>
	{
		let data = '';
		res.on('data', chunk => data += chunk);
		res.on('end', () =>
		{
			res.data = data;
			resolve(res);
		});
	});
	req.on('error',reject);
	req.write(body);
	req.end();
});

const getInput = x => (process.env['INPUT_' + x] || '').trim();

readFile(getInput('upfile'), (err, content) =>
{
	if (err)
		console.error(err);

	const boundary = 'xxxxxxxxxx';
	const boundaryString =  `--${boundary}\r\n`;
	const data = [
		boundaryString,
		Object.entries(getInput('metadata').split("\n").filter(x => x !== ""))
			.map(([key, val]) => `Content-Disposition: form-data; name="${key}"; \r\n\r\n${val}\r\n`)
			.join(boundaryString),
		boundaryString,
		`Content-Disposition: form-data; name="upfile"; filename="${upfile}"\r\n`,
		'Content-Type: application/octet-stream\r\n\r\n'
	];
	httpsPost(
		{
			hostname: getInput('hostname');
			path: getInput('path');
			method: getInput('method');
			headers: {
				'Content-Type': `multipart/form-data; boundary=${boundary}`
			}
		},
		Buffer.concat([
			Buffer.from(data.join(''), 'utf8'),
			Buffer.from(content, 'binary'),
			Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
		])
	).then(response =>
	{
		const statusCode = response.statusCode;
		const colorNum = statusCode >= 400 ? 31 : (statusCode >= 300 ? 33 : 32);
		const char = statusCode >= 400 ? '✖' : (statusCode >= 300 ? '⚠' : '✔');
		console.log(
			'\u001B[%dm%s\u001B[39m Server responded with \u001B[1;%dm%s\u001B[22m %s\u001B[39m\n\##[group]Additional info\n%s\n##[endgroup]',
			colorNum,
			char,
			colorNum,
			statusCode,
			response.statusMessage,
			response.data
		);
	}).catch(err =>
	{
		console.error(err);
	});
});
