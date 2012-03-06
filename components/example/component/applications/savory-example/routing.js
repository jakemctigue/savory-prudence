
app.hosts = {
	'default': '/savory-example/'
}

app.routes = {
	'/*': [
		'explicit',
		'dynamicWeb',
		[
			'staticWeb',
			{type: 'staticWeb', root: sincerity.container.getLibrariesFile('web')}
		]
	]
}
