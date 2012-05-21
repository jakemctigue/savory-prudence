Name:           savory
Summary:        A server-side JavaScript web development framework based on Prudence and MongoDB.
Version:        1.0beta1
Release:        0
Group:          Three Crickets
License:        LGPLv3+

%description 
A server-side JavaScript web development framework based on Prudence and MongoDB.

%prep

%build

%clean 

%install

%post
mkdir -p /usr/lib/savory/.sincerity

mkdir -p /var/logs/savory
chmod a+w /var/logs/savory
ln -fsT /var/logs/savory /usr/lib/savory/logs

mkdir -p /var/cache/savory
chmod a+w /var/cache/savory
ln -fsT /var/cache/savory /usr/lib/savory/cache 

chmod a+w -R /var/lib/savory
chmod a+w -R /etc/savory

ln -fsT /var/lib/savory/programs /usr/lib/savory/programs 
ln -fsT /var/lib/savory/libraries /usr/lib/savory/libraries 
ln -fsT /var/lib/savory/component /usr/lib/savory/component 
ln -fsT /etc/savory /usr/lib/savory/configuration 

%preun
rm -rf /usr/lib/savory/.sincerity
rm -f /usr/lib/savory/logs
rm -f /usr/lib/savory/cache
rm -f /usr/lib/savory/programs
rm -f /usr/lib/savory/libraries
rm -f /usr/lib/savory/component
rm -f /usr/lib/savory/configuration

%files
/*

%changelog
* Thu May 10 2012 Tal Liron <tal.liron@threecrickets.com>
- Initial release
