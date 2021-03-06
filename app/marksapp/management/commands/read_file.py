from html.parser import HTMLParser
from datetime import datetime


class NetscapeParser(HTMLParser):
    add_mark = False
    add_cat = False
    add_date = 0
    icon = ""
    href = ""
    tags = ""
    categories = []
    bookmarks = []

    def handle_starttag(self, tag, attrs):
        if tag == "h3":
            self.add_cat = True
        if tag == "a":
            self.add_mark = True
            for attr in attrs:
                if attr[0] == "href":
                    self.href = attr[1]
                elif attr[0] == "add_date":
                    self.add_date = datetime.utcfromtimestamp(int(attr[1]))
                elif attr[0] == "icon":
                    self.icon = attr[1]
                elif attr[0] == "tags":
                    self.tags = attr[1].split(",")

    def handle_endtag(self, tag):
        if tag == "dl":
            if self.categories:
                self.categories.pop()

    def handle_data(self, data):
        if self.add_cat == True:
            self.categories.append(data.lower())
            self.add_cat = False
        elif self.add_mark == True:
            mark = {}
            mark["name"] = data
            mark["url"] = self.href
            mark["categories"] = self.categories[:]
            mark["tags"] = self.tags
            mark["add_date"] = self.add_date
            self.bookmarks.append(mark)
            self.tags = ""
            self.add_mark = False


def bookmarks_from_file(filename):
    with open(filename, "r") as f:
        bookmarks = f.read()

        parser = NetscapeParser()
        parser.feed(bookmarks)
        return parser.bookmarks
