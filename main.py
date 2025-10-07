import sys
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QDockWidget, QWidget, QVBoxLayout,
    QLabel, QMenuBar, QTextEdit
)
from PyQt6.QtGui import QAction, QColor, QPalette
from PyQt6.QtCore import Qt


class FLStudioClone(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("FL Studio Clone - Phase 1")
        self.resize(1400, 800)
        self._apply_dark_theme()
        self._create_menu_bar()
        self._create_layout()

    def _apply_dark_theme(self):
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor(30, 30, 30))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(230, 230, 230))
        palette.setColor(QPalette.ColorRole.Base, QColor(45, 45, 45))
        palette.setColor(QPalette.ColorRole.Text, QColor(230, 230, 230))
        palette.setColor(QPalette.ColorRole.Button, QColor(50, 50, 50))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(230, 230, 230))
        self.setPalette(palette)

    def _create_menu_bar(self):
        menu_bar = QMenuBar()
        self.setMenuBar(menu_bar)

        file_menu = menu_bar.addMenu("File")
        edit_menu = menu_bar.addMenu("Edit")
        view_menu = menu_bar.addMenu("View")
        help_menu = menu_bar.addMenu("Help")

        exit_action = QAction("Exit", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

    def _create_dock(self, title: str, content: str):
        dock = QDockWidget(title, self)
        dock.setAllowedAreas(Qt.DockWidgetArea.AllDockWidgetAreas)
        widget = QWidget()
        layout = QVBoxLayout()
        layout.addWidget(QLabel(content))
        widget.setLayout(layout)
        dock.setWidget(widget)
        return dock

    def _create_layout(self):
        # Central Widget (Playlist)
        playlist = QTextEdit("Playlist area (timeline, patterns, etc.)")
        playlist.setReadOnly(True)
        self.setCentralWidget(playlist)

        # Dock Widgets
        channel_rack = self._create_dock("Channel Rack", "Step Sequencer / Drum Pads")
        mixer = self._create_dock("Mixer", "Volume sliders, FX slots")
        piano_roll = self._create_dock("Piano Roll", "Note editor")

        self.addDockWidget(Qt.DockWidgetArea.LeftDockWidgetArea, channel_rack)
        self.addDockWidget(Qt.DockWidgetArea.RightDockWidgetArea, mixer)
        self.addDockWidget(Qt.DockWidgetArea.BottomDockWidgetArea, piano_roll)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = FLStudioClone()
    window.show()
    sys.exit(app.exec())
