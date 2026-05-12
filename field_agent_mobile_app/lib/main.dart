import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:glassmorphism/glassmorphism.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:camera/camera.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:http/http.dart' as http;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DexterXApp());
}

class DexterXApp extends StatelessWidget {
  const DexterXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DEXTERX FIELD AGENT',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        primaryColor: const Color(0xFFF43F5E),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 3.0,
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Color(0xFFCBD5E1)),
        ),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFF43F5E),
          surface: Color(0xFF0F172A),
        ),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const ScannerScreen(),
        '/results': (context) => const ResultsScreen(),
      },
    );
  }
}

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> with TickerProviderStateMixin {
  CameraController? _cameraController;
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  bool _isListening = false;
  bool _isRecording = false;
  bool _isUploading = false;
  String? _videoPath;
  final TextEditingController _textController = TextEditingController();

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _initializeSpeech();
    
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _textController.addListener(() {
      setState(() {});
    });
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isNotEmpty) {
        final backCamera = cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.back,
          orElse: () => cameras.first,
        );
        _cameraController = CameraController(
          backCamera,
          ResolutionPreset.medium,
          enableAudio: true,
        );
        await _cameraController!.initialize();
        if (mounted) setState(() {});
      }
    } catch (e) {
      debugPrint('Camera initialization error: $e');
    }
  }

  Future<void> _initializeSpeech() async {
    try {
      await _speechToText.initialize(
        onError: (error) => debugPrint('STT Error: $error'),
        onStatus: (status) {
          debugPrint('STT Status: $status');
          if (status == 'notListening' || status == 'done') {
            if (mounted) setState(() => _isListening = false);
          }
        },
      );
    } catch (e) {
      debugPrint('Speech init error: $e');
    }
  }

  void _listen() async {
    if (!_isListening) {
      bool available = await _speechToText.initialize();
      if (available) {
        setState(() => _isListening = true);
        _speechToText.listen(
          onResult: (val) {
            setState(() {
              _textController.text = val.recognizedWords;
            });
          },
        );
      }
    } else {
      setState(() => _isListening = false);
      _speechToText.stop();
    }
  }

  void _recordVideo() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;

    try {
      if (_isRecording) {
        final file = await _cameraController!.stopVideoRecording();
        setState(() {
          _isRecording = false;
          _videoPath = file.path;
        });
      } else {
        await _cameraController!.startVideoRecording();
        setState(() {
          _isRecording = true;
          _videoPath = null;
        });
      }
    } catch (e) {
      debugPrint('Video recording error: $e');
    }
  }

  Future<void> _uploadData() async {
    if (_videoPath == null || _textController.text.isEmpty) return;

    setState(() {
      _isUploading = true;
    });

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('http://192.168.0.108:8000/api/process-cctv'),
      );
      request.fields['report_text'] = _textController.text;
      request.files.add(await http.MultipartFile.fromPath('file', _videoPath!));

      var streamedResponse = await request.send().timeout(const Duration(seconds: 180));
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        var jsonData = json.decode(response.body);
        if (mounted) {
          Navigator.pushNamed(context, '/results', arguments: jsonData);
        }
      } else {
        debugPrint('Upload failed with status: ${response.statusCode}');
        debugPrint('Response: ${response.body}');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Upload Failed: ${response.statusCode}'),
              backgroundColor: const Color(0xFFF43F5E),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Upload error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload Error: $e'),
            backgroundColor: const Color(0xFFF43F5E),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _textController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  bool get _canUpload => _videoPath != null && _textController.text.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final bool showText = _isListening || _textController.text.isNotEmpty;
    final bool showUpload = _canUpload && !_isRecording && !_isUploading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('DEXTERX FIELD AGENT'),
      ),
      body: Stack(
        children: [
          // Background/Central Container (Camera Preview)
          Padding(
            padding: const EdgeInsets.only(left: 16.0, right: 16.0, top: 8.0, bottom: 160.0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
              width: double.infinity,
              height: double.infinity,
              clipBehavior: Clip.hardEdge,
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: _isRecording ? const Color(0xFFF43F5E).withOpacity(0.8) : const Color(0xFF06B6D4).withOpacity(0.5),
                  width: _isRecording ? 3 : 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _isRecording ? const Color(0xFFF43F5E).withOpacity(0.3) : const Color(0xFF06B6D4).withOpacity(0.15),
                    blurRadius: _isRecording ? 30 : 20,
                    spreadRadius: _isRecording ? 5 : 2,
                  ),
                ],
              ),
              child: _cameraController != null && _cameraController!.value.isInitialized
                  ? SizedBox.expand(
                      child: FittedBox(
                        fit: BoxFit.cover,
                        child: SizedBox(
                          width: _cameraController!.value.previewSize?.height ?? 1,
                          height: _cameraController!.value.previewSize?.width ?? 1,
                          child: CameraPreview(_cameraController!),
                        ),
                      ),
                    )
                  : const Center(
                      child: Text(
                        'INITIALIZING CAMERA...',
                        style: TextStyle(
                          color: Color(0xFF06B6D4),
                          letterSpacing: 3.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
            ),
          ),
          
          // Dictated Text Field
          Align(
            alignment: Alignment.bottomCenter,
            child: AnimatedOpacity(
              opacity: showText ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 400),
              child: AnimatedSlide(
                offset: showText ? Offset.zero : const Offset(0, 0.5),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOutBack,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 160.0, left: 24.0, right: 24.0),
                  child: IgnorePointer(
                    ignoring: !showText,
                    child: TextField(
                      controller: _textController,
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                      maxLines: 3,
                      minLines: 1,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.black87,
                        hintText: 'Dictated notes...',
                        hintStyle: const TextStyle(color: Colors.white54),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: Color(0xFF06B6D4), width: 1.5),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: Color(0xFF06B6D4), width: 1.5),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: const BorderSide(color: Color(0xFF06B6D4), width: 2.5),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Upload Button
          Align(
            alignment: Alignment.center,
            child: AnimatedOpacity(
              opacity: showUpload ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 600),
              child: AnimatedScale(
                scale: showUpload ? 1.0 : 0.8,
                duration: const Duration(milliseconds: 600),
                curve: Curves.elasticOut,
                child: IgnorePointer(
                  ignoring: !showUpload,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 100),
                    child: ScaleTransition(
                      scale: _pulseAnimation,
                      child: InkWell(
                        onTap: _uploadData,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F172A).withOpacity(0.9),
                            borderRadius: BorderRadius.circular(32),
                            border: Border.all(color: const Color(0xFF06B6D4), width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF06B6D4).withOpacity(0.6),
                                blurRadius: 40,
                                spreadRadius: 8,
                              ),
                            ],
                          ),
                          child: const Text(
                            'UPLOAD TO DEXTERX NEURAL NET',
                            style: TextStyle(
                              color: Color(0xFF06B6D4),
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          
          // Bottom Control Panel
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 32.0, left: 16.0, right: 16.0),
              child: GlassmorphicContainer(
                width: double.infinity,
                height: 120,
                borderRadius: 24,
                blur: 20,
                alignment: Alignment.center,
                border: 1.5,
                linearGradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFFFFFFFF).withOpacity(0.1),
                    const Color(0xFFFFFFFF).withOpacity(0.05),
                  ],
                  stops: const [0.1, 1],
                ),
                borderGradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    const Color(0xFFFFFFFF).withOpacity(0.5),
                    const Color(0xFFFFFFFF).withOpacity(0.1),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Dictate Notes Button
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ScaleTransition(
                          scale: _isListening ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
                          child: IconButton(
                            onPressed: _isUploading ? null : _listen,
                            icon: Icon(
                              _isListening ? LucideIcons.micOff : LucideIcons.mic,
                              color: _isListening ? const Color(0xFF06B6D4) : const Color(0xFFCBD5E1)
                            ),
                            iconSize: 28,
                          ),
                        ),
                        Text(
                          _isListening ? 'LISTENING...' : 'DICTATE NOTES',
                          style: TextStyle(
                            color: _isListening ? const Color(0xFF06B6D4) : const Color(0xFFCBD5E1),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                    
                    // Record Video Button
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ScaleTransition(
                          scale: _isRecording ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
                          child: Container(
                            height: 64,
                            width: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFFF43F5E).withOpacity(0.5),
                                width: 4,
                              ),
                              boxShadow: [
                                if (_isRecording)
                                  BoxShadow(
                                    color: const Color(0xFFF43F5E).withOpacity(0.4),
                                    blurRadius: 15,
                                    spreadRadius: 5,
                                  ),
                              ],
                            ),
                            child: Center(
                              child: Container(
                                height: 52,
                                width: 52,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFF43F5E),
                                  shape: BoxShape.circle,
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    customBorder: const CircleBorder(),
                                    onTap: _isUploading ? null : _recordVideo,
                                    child: Center(
                                      child: Icon(
                                        _isRecording ? LucideIcons.square : LucideIcons.video,
                                        color: Colors.white,
                                        size: 24,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _isRecording ? 'STOP RECORDING' : 'RECORD VIDEO',
                          style: const TextStyle(
                            color: Color(0xFFF43F5E),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                    
                    // Results/Action Button
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          onPressed: () {
                            Navigator.pushNamed(context, '/results');
                          },
                          icon: const Icon(LucideIcons.fileSearch, color: Color(0xFFCBD5E1)),
                          iconSize: 28,
                        ),
                        const Text(
                          'RESULTS',
                          style: TextStyle(
                            color: Color(0xFFCBD5E1),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Uploading Overlay
          if (_isUploading)
            AnimatedOpacity(
              opacity: 1.0,
              duration: const Duration(milliseconds: 300),
              child: Container(
                color: const Color(0xFF0F172A).withOpacity(0.9),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(color: Color(0xFF06B6D4)),
                      const SizedBox(height: 24),
                      const Text(
                        'UPLOADING TO MAINFRAME...',
                        style: TextStyle(
                          color: Color(0xFF06B6D4),
                          letterSpacing: 2.0,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'INITIALIZING YOLOv8...',
                        style: TextStyle(
                          color: const Color(0xFF06B6D4).withOpacity(0.7),
                          letterSpacing: 1.5,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class ResultsScreen extends StatelessWidget {
  const ResultsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final Map<String, dynamic>? data = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;

    final num rawRiskScore = data?['overall_risk_score'] ?? 0;
    final int riskScore = rawRiskScore.toInt();
    final List<dynamic> flags = data?['tod_estimation']?['investigative_flags'] ?? [];
    final List<dynamic> entities = data?['digital_correlation']?['nodes'] ?? [];

    final bool isHighRisk = riskScore > 80;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('MISSION CONTROL: TRIAGE'),
      ),
      body: data == null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.shieldAlert, size: 64, color: Color(0xFFF43F5E)),
                  const SizedBox(height: 16),
                  const Text(
                    'NO DATA RECEIVED',
                    style: TextStyle(
                      color: Color(0xFFF43F5E),
                      letterSpacing: 2.0,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1E293B),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    child: const Text('RETURN TO SCANNER', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            )
          : SafeArea(
              child: TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0.0, end: 1.0),
                duration: const Duration(milliseconds: 800),
                curve: Curves.easeOutQuint,
                builder: (context, value, child) {
                  return Opacity(
                    opacity: value,
                    child: Transform.translate(
                      offset: Offset(0, 50 * (1 - value)),
                      child: child,
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Card: OVERALL RISK SCORE
                      TweenAnimationBuilder<double>(
                        tween: Tween<double>(begin: 0.8, end: 1.0),
                        duration: const Duration(milliseconds: 600),
                        curve: Curves.easeOutBack,
                        builder: (context, scale, child) {
                          return Transform.scale(
                            scale: scale,
                            child: child,
                          );
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isHighRisk ? const Color(0xFFF43F5E) : const Color(0xFF06B6D4),
                              width: 2,
                            ),
                            boxShadow: [
                              if (isHighRisk)
                                BoxShadow(
                                  color: const Color(0xFFF43F5E).withOpacity(0.3),
                                  blurRadius: 30,
                                  spreadRadius: 8,
                                ),
                            ],
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'OVERALL RISK SCORE',
                                style: TextStyle(
                                  color: Color(0xFFCBD5E1),
                                  letterSpacing: 2.0,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TweenAnimationBuilder<double>(
                                tween: Tween<double>(begin: 0, end: riskScore.toDouble()),
                                duration: const Duration(seconds: 2),
                                curve: Curves.easeOutCubic,
                                builder: (context, scoreValue, child) {
                                  return Text(
                                    '${scoreValue.toInt()}',
                                    style: TextStyle(
                                      color: isHighRisk ? const Color(0xFFF43F5E) : Colors.white,
                                      fontSize: 56,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Alert Cards
                      if (flags.isNotEmpty) ...[
                        const Text(
                          'CRITICAL ALERTS',
                          style: TextStyle(
                            color: Color(0xFFF43F5E),
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...flags.map((flag) => Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF43F5E).withOpacity(0.1),
                                border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.5)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(LucideIcons.alertTriangle, color: Color(0xFFF43F5E)),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Text(
                                      flag.toString(),
                                      style: const TextStyle(color: Colors.white),
                                    ),
                                  ),
                                ],
                              ),
                            )),
                        const SizedBox(height: 24),
                      ],

                      // Entities List
                      const Text(
                        'DETECTED ENTITIES (YOLO & QWEN)',
                        style: TextStyle(
                          color: Color(0xFF06B6D4),
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: entities.isEmpty
                            ? const Text(
                                'No entities detected.',
                                style: TextStyle(color: Color(0xFFCBD5E1)),
                              )
                            : ListView.builder(
                                physics: const BouncingScrollPhysics(),
                                itemCount: entities.length,
                                itemBuilder: (context, index) {
                                  final Map<String, dynamic> entity = entities[index] is Map ? entities[index] : {};
                                  final String id = entity['id']?.toString() ?? 'UNKNOWN_NODE';
                                  final String type = entity['type']?.toString() ?? entity['label']?.toString() ?? 'ENTITY';
                                  final String group = entity['group']?.toString() ?? '';
                                  
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1E293B),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.3)),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          type.toLowerCase().contains('person') || group.toLowerCase().contains('suspect') 
                                              ? LucideIcons.user 
                                              : LucideIcons.box,
                                          color: const Color(0xFF06B6D4),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                id.toUpperCase(),
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              if (type != 'ENTITY')
                                                Text(
                                                  type.toUpperCase(),
                                                  style: const TextStyle(
                                                    color: Color(0xFFCBD5E1),
                                                    fontSize: 12,
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),

                      // Bottom Button
                      Padding(
                        padding: const EdgeInsets.only(top: 16.0),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF06B6D4).withOpacity(0.2),
                              side: const BorderSide(color: Color(0xFF06B6D4)),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                            child: const Text(
                              'ACKNOWLEDGE & CLOSE',
                              style: TextStyle(
                                color: Color(0xFF06B6D4),
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2.0,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
