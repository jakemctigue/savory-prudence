
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
			start = this.content.indexOf('</h1>', start) + 5
			var after = this.content.indexOf('</a>', start) + 4
			var end = this.content.indexOf('<h1 class="Section">', after)
			if (end < 0) {
				end = this.content.indexOf('<hr class="footer"/>', after)
			}
			//return new Section(name, '<h1 class="Section">' + this.content.substring(start, end))
			return new Section(name, this.content.substring(start, end))
		}
	}

	this.generate = function(sections) {
		for (var name in sections) {
			var section = this.getSection(name)
			var file = sincerity.container.getFile(sections[name])
			file.parentFile.mkdirs()
			println('Generating ' + file)
			var out = Sincerity.Files.openForTextWriting(file)
			out.println(section.content)
			section.printTOC(out)
			out.close()
		}
	}

	println('Loading ' + file)
	this.content = String(Sincerity.Files.loadText(file))
	this.clean()
}

var manual = new Manual(application.arguments[1])
manual.generate({
	'Backup Service': ['component/applications/savory-example/fragments/manual/service/backup.html'],
	'Cache Service': ['component/applications/savory-example/fragments/manual/service/cache.html'],
	'Internationalization Service': ['component/applications/savory-example/fragments/manual/service/internationalization.html'],
	'Nonces Service': ['component/applications/savory-example/fragments/manual/service/nonces.html'],
	'Notification Service': ['component/applications/savory-example/fragments/manual/service/notification.html'],
	'Serials Service': ['component/applications/savory-example/fragments/manual/service/serials.html']
})