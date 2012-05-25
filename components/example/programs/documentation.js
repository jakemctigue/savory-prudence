
document.executeOnce('/sincerity/files/')

var Section = function(name, content) {
	this.printTOC = function(out) {
		out.println('<div id="toc">')
		out.println('<div class="title"><a href=".">' + name + '</a></div>')
		
		var subsectionRE = /<a class="toc" name="toc-Subsection-(\d+)"><\/a>(.*?)(?:<a |\s<\/h2>)/
		var subsubsectionRE = /<a class="toc" name="toc-Subsubsection-(\d+)"><\/a>(.*?)(?:<a |\s<\/h3>)/
		var subsection = this.content.match(subsectionRE)
		var nextIndex = subsection ? subsection.index + subsection[0].length : 0
		var index, subsubsection
		while (subsection) {
			out.println('<div class="subsection"><a href="#toc-Subsection-' + subsection[1] + '">' + subsection[2] + '</a></div>')
			index = nextIndex
			subsection = this.content.substring(index).match(subsectionRE)
			nextIndex = subsection ? index + subsection.index + subsection[0].length : this.content.length

			subsubsection = this.content.substring(index, nextIndex).match(subsubsectionRE)
			while (subsubsection) {
				out.println('<div class="subsubsection"><a href="#toc-Subsubsection-' + subsubsection[1] + '">' + subsubsection[2] + '</a></div>')
				index += subsubsection.index + subsubsection[0].length
				subsubsection = this.content.substring(index, nextIndex).match(subsubsectionRE)
			}
		}

		out.println('</div>')
	}
	
	this.name = name
	this.content = content
}

var Manual = function(file) {
	this.clean = function() {
		// Fix eLyXer output to more common HTML text
		this.content = this.content.replace(/‘‘/g, '"')
		this.content = this.content.replace(/’’/g, '"')
		this.content = this.content.replace(/’/g, "'")
		this.content = this.content.replace(/---/g, '&mdash;')
		
		// Tricks with cross-references
		this.content = this.content.replace(/<u>(.*?)<\/u>\s*<u>\s*\(page\s*<a class="Reference" href="#(.+?)">.*?<\/a>\s*\)\s*<\/u>/g, '<a class="Reference" href="$2">$1</a>')
		this.content = this.content.replace(/<u>(.*?)\s*\(page\s*<a class="Reference" href="#(.+?)">.*?<\/a>\s*\)\s*<\/u>/g, '<a class="Reference" href="$2">$1</a>')

		this.content = this.content.replace(/↑/g, '')
		this.content = this.content.replace(/↓/g, '')
		this.content = this.content.replace(/\|/g, '#')
		
		// Tricks with labels
		this.content = this.content.replace(/<a class="Label" name=".+#/g, '<a class="Label" name="')
	}
	
	this.getSection = function(name) {
		var headingRE = new RegExp('<a class="toc" name="toc-Section-\\d+"></a>' + name)
		var start = this.content.search(headingRE)
		if (start != -1) {
			var after = this.content.indexOf('</a>', start) + 4
			var end = this.content.indexOf('<h1 class="Section">', after)
			if (end < 0) {
				end = this.content.indexOf('<hr class="footer"/>', after)
			}
			return new Section(name, '<h1 class="Section">' + this.content.substring(start, end))
		}
	}

	this.generate = function(sections) {
		for (var name in sections) {
			var section = this.getSection(name)
			var file = sincerity.container.getFile(sections[name])
			file.parentFile.mkdirs()
			println('Generating ' + file)
			var out = Sincerity.Files.openForTextWriting(file)
			out.println('<% document.cacheDuration = 300000; document.cacheTags.add(\'manual\'); var title = \'' + name + '\'; %>')
			out.println('<%& /header/ %>')
			out.println('<%& /license/ %>')
			out.println(section.content)
			section.printTOC(out)
			out.println('<%& /footer/ %>')
			out.close()
		}
	}

	this.content = String(Sincerity.Files.loadText(file))
	this.clean()
}

var manual = new Manual('/Depot/Projects/Collaborative/Prudence/build/distribution/content/reference/manuals/com.threecrickets.prudence/prudence/2.0-beta1/prudence_manual.html')
//var manual = new Manual(sincerity.container.getFile('component/applications/prudence/mapped/manual/prudence_manual.html'))
manual.generate({
	'Administration': ['component/applications/prudence/mapped/manual/administration.d.html'],
	'API': ['component/applications/prudence/mapped/manual/api.d.html'],
	'Prudence Applications': ['component/applications/prudence/mapped/manual/application.d.html'],
	'Prudence Clusters': ['component/applications/prudence/mapped/manual/clusters.d.html'],
	'Prudence As a Daemon': ['component/applications/prudence/mapped/manual/daemon.d.html'],
	'Debugging': ['component/applications/prudence/mapped/manual/debugging.d.html'],
	'Generating HTML': ['component/applications/prudence/mapped/manual/generating-html.d.html'],
	'Handlers': ['component/applications/prudence/mapped/manual/handlers.d.html'],
	'HTTP Proxy': ['component/applications/prudence/mapped/manual/http-proxy.d.html'],
	'The Prudence Instance': ['component/applications/prudence/mapped/manual/instance.d.html'],
	'Logging': ['component/applications/prudence/mapped/manual/logging.d.html'],
	'Management and Monitoring': ['component/applications/prudence/mapped/manual/monitoring.d.html'],
	'Resources': ['component/applications/prudence/mapped/manual/resources.d.html'],
	'Prudence As a Restlet Container': ['component/applications/prudence/mapped/manual/restlet-container.d.html'],
	'Routing': ['component/applications/prudence/mapped/manual/routing.d.html'],
	'Static Web': ['component/applications/prudence/mapped/manual/static-web.d.html'],
	'Tasks': ['component/applications/prudence/mapped/manual/tasks.d.html'],
	'Tutorial': ['component/applications/prudence/mapped/manual/tutorial.d.html'],
	'Under the Hood': ['component/applications/prudence/mapped/under-the-hood.d.html'],
	'Scaling Tips': ['component/applications/prudence/mapped/scaling.d.html'],
	'The Case for REST': ['component/applications/prudence/mapped/rest.d.html'],
	'FAQ': ['component/applications/prudence/mapped/faq.d.html']
})


manual = new Manual('/Depot/Projects/Collaborative/Sincerity/build/distribution/content/reference/manuals/com.threecrickets.sincerity/sincerity/1.0-beta1/sincerity_manual.html')
manual.generate({
	'Background': ['component/applications/sincerity/mapped/manual/background.d.html'],
	'Tutorial': ['component/applications/sincerity/mapped/manual/tutorial.d.html'],
	'Extending Sincerity': ['component/applications/sincerity/mapped/manual/extending.d.html'],
	'Core Plugins': ['component/applications/sincerity/mapped/ecosystem/core-plugins.d.html'],
	'Language Plugins': ['component/applications/sincerity/mapped/ecosystem/language-plugins.d.html'],
	'Feature Plugins': ['component/applications/sincerity/mapped/ecosystem/feature-plugins.d.html'],
	'Skeletons': ['component/applications/sincerity/mapped/ecosystem/skeletons.d.html'],
	'Repositories': ['component/applications/sincerity/mapped/ecosystem/repositories.d.html']
})
