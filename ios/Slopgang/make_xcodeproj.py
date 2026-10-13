#!/usr/bin/env python3
"""Writes Slopgang.xcodeproj without a Mac. Same settings as project.yml.
XcodeGen does not build on Linux, so this keeps a committed project in the repo.
On a Mac you can instead run `xcodegen generate` from this folder."""
import hashlib, os, glob
here = os.path.dirname(os.path.abspath(__file__))
def oid(s): return hashlib.md5(s.encode()).hexdigest()[:24].upper()
swift = sorted(os.path.basename(p) for p in glob.glob(os.path.join(here, 'Slopgang', '*.swift')) + glob.glob(os.path.join(here, 'Slopgang', '*.metal')))
# Bundle resources outside the asset catalog: fonts (+ OFL licenses) and sounds.
extras = {d: sorted(os.path.basename(p) for p in glob.glob(os.path.join(here, 'Slopgang', 'Resources', d, '*')) if not p.endswith('.DS_Store'))
          for d in ('Fonts', 'Sounds')}
def ftype(f):
    return {'.swift': 'sourcecode.swift', '.metal': 'sourcecode.metal', '.ttf': 'file', '.wav': 'audio.wav', '.txt': 'text'}[os.path.splitext(f)[1]]
P = oid('project'); T = oid('target'); MAIN = oid('maingroup'); APPG = oid('appgroup'); RESG = oid('resgroup')
PRODG = oid('products'); PROD = oid('product.app'); SRC = oid('sources'); RES = oid('resources'); FW = oid('frameworks')
ASSET = oid('assets'); ASSETB = oid('assets.build')
PCL = oid('proj.configlist'); TCL = oid('target.configlist')
PD, PR, TD, TR = oid('pdebug'), oid('prelease'), oid('tdebug'), oid('trelease')
L = []
w = L.append
w('// !$*UTF8*$!\n{\n\tarchiveVersion = 1;\n\tclasses = {\n\t};\n\tobjectVersion = 56;\n\tobjects = {\n')
w('\n/* Begin PBXBuildFile section */\n')
for f in swift: w(f'\t\t{oid("b"+f)} /* {f} in Sources */ = {{isa = PBXBuildFile; fileRef = {oid("f"+f)} /* {f} */; }};\n')
w(f'\t\t{ASSETB} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {ASSET} /* Assets.xcassets */; }};\n')
for d, fs in extras.items():
    for f in fs:
       : w(f'\t\t{oid("b"+d+f)} /* {f} in Resources */ = {{isa = PBXBuildFile; fileRef = {oid("f"+d+f)} /* {f} */; }};\n')
w('/* End PBXBuildFile section */\n\n/* Begin PBXFileReference section */\n')
for f in swift: w(f'\t\t{oid("f"+f)} /* {f} */ = {{isa = PBXFileReference; lastKnownFileType = {ftype(f)}; path = {f}; sourceTree = "<group>"; }};\n')
for d, fs in extras.items():
    for f in fs: w(f'\t\t{oid("f"+d+f)} /* {f} */ = {{isa = PBXFileReference; lastKnownFileType = {ftype(f)}; path = "{f}"; sourceTree = "<group>"; }};\n')
w(f'\t\t{ASSET} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};\n')
w(f'\t\t{PROD} /* Slopgang.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Slopgang.app; sourceTree = BUILT_PRODUCTS_DIR; }};\n')
w('/* End PBXFileReference section */\n\n/* Begin PBXFrameworksBuildPhase section */\n')
w(f'\t\t{FW} /* Frameworks */ = {{\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n')
w('/* End PBXFrameworksBuildPhase section */\n\n/* Begin PBXGroup section */\n')
w(f'\t\t{MAIN} = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t{APPG} /* Slopgang */,\n\t\t\t\t{PRODG} /* Products */,\n\t\t\t);\n\t\t\tsourceTree = "<group>";\n\t\t}};\n')
kids = ''.join(f'\t\t\t\t{oid("f"+f)} /* {f} */,\n' for f in swift)
w(f'\t\t{APPG} /* Slopgang */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n{kids}\t\t\t\t{RESG} /* Resources */,\n\t\t\t);\n\t\t\tpath = Slopgang;\n\t\t\tsourceTree = "<group>";\n\t\t}};\n')
sub = ''.join(f'\t\t\t\t{oid("group"+d)} /* {d} */,\n' for d in extras)
for d, fs in extras.items():
    ch = ''.join(f'\t\t\t\t{oid("f"+d+f)} /* {f} */,\n' for f in fs)
    w(f'\t\t{oid("group"+d)} /* {d} */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n{ch}\t\t\t);\n\t\t\tpath = {d};\n\t\t\tsourceTree = "<group>";\n\t\t}};\n')
w(f'\t\t{RESG} /* Resources */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t{ASSET} /* Assets.xcassets */,\n{sub}\t\t\t);\n\t\t\tpath = Resources;\n\t\t\tsourceTree = "<group>";\n\t\t}};\n')
w(f'\t\t{PRODG} /* Products */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t{PROD} /* Slopgang.app */,\n\t\t\t);\n\t\t\tname = Products;\n\t\t\tsourceTree = "<group>";\n\t\t}};\n')
w('/* End PBXGroup section */\n\n/* Begin PBXNativeTarget section */\n')
w(f'\t\t{T} /* Slopgang */ = {{\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = {TCL};\n\t\t\tbuildPhases = (\n\t\t\t\t{SRC} /* Sources */,\n\t\t\t\t{FW} /* Frameworks */,\n\t\t\t\t{RES} /* Resources */,\n\t\t\t);\n\t\t\tbuildRules = (\n\t\t\t);\n\t\t\tdependencies = (\n\t\t\t);\n\t\t\tname = Slopgang;\n\t\t\tproductName = Slopgang;\n\t\t\tproductReference = {PROD} /* Slopgang.app */;\n\t\t\tproductType = "com.apple.product-type.application";\n\t\t}};\n')
resfiles = ''.join(f'\t\t\t\t{oid("b"+d+f)} /* {f} in Resources */,\n' for d, fs in extras.items() for f in fs)
w('/* End PBXNativeTarget section */\n\n/* Begin PBXProject section */\n')
w(f'\t\t{P} /* Project object */ = {{\n\t\t\tisa = PBXProject;\n\t\t\tattributes = {{\n\t\t\t\tBuildIndependentTargetsInParallel = 1;\n\t\t\t\tLastSwiftUpdateCheck = 1500;\n\t\t\t\tLastUpgradeCheck = 1500;\n\t\t\t\tTargetAttributes = {{\n\t\t\t\t\t{T} = {{\n\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;\n\t\t\t\t\t}};\n\t\t\t\t}};\n\t\t\t}};\n\t\t\tbuildConfigurationList = {PCL};\n\t\t\tcompatibilityVersion = "Xcode 14.0";\n\t\t\tdevelopmentRegion = en;\n\t\t\thasScannedForEncodings = 0;\n\t\t\tknownRegions = (\n\t\t\t\ten,\n\t\t\t\tBase,\n\t\t\t);\n\t\t\tmainGroup = {MAIN};\n\t\t\tproductRefGroup = {PRODG} /* Products */;\n\t\t\tprojectDirPath = "";\n\t\t\tprojectRoot = "";\n\t\t\ttargets = (\n\t\t\t\t{T} /* Slopgang */,\n\t\t\t);\n\t\t}};\n')
w('/* End PBXProject section */\n\n/* Begin PBXResourcesBuildPhase section */\n')
w(f'\t\t{RES} /* Resources */ = {{\n\t\t\tisa = PBXResourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t\t{ASSETB} /* Assets.xcassets in Resources */,\n{resfiles}\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n')
w('/* End PBXResourcesBuildPhase section */\n\n/* Begin PBXSourcesBuildPhase section */\n')
files = ''.join(f'\t\t\t\t{oid("b"+f)} /* {f} in Sources */,\n' for f in swift)
w(f'\t\t{SRC} /* Sources */ = {{\n\t\t\tisa = PBXSourcesBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n{files}\t\t\t);\n\t\t\trunOnlyForDeploymentPostprocessing = 0;\n\t\t}};\n')
w('/* End PBXSourcesBuildPhase section */\n\n/* Begin XCBuildConfiguration section */\n')
def q(v): return v if v.replace('_','').replace('.','').isalnum() else f'"{v}"'
def cfg(i, name, d):
    body = ''.join(f'\t\t\t\t{k} = {q(v)};\n' for k, v in sorted(d.items()))
    w(f'\t\t{i} /* {name} */ = {{\n\t\t\tisa = XCBuildConfiguration;\n\t\t\tbuildSettings = {{\n{body}\t\t\t}};\n\t\t\tname = {name};\n\t\t}};\n')
proj = dict(ALWAYS_SEARCH_USER_PATHS='NO', CLANG_ENABLE_MODULES='YES', CLANG_ENABLE_OBJC_ARC='YES', ENABLE_STRICT_OBJC_MSGSEND='YES',
            GCC_C_LANGUAGE_STANDARD='gnu17', IPHONEOS_DEPLOYMENT_TARGET='17.0', SDKROOT='iphoneos', SWIFT_VERSION='5.0',
            MTL_FAST_MATH='YES', ENABLE_USER_SCRIPT_SANDBOXING='YES', LOCALIZATION_PREFERS_STRING_CATALOGS='YES')
cfg(PD, 'Debug', {**proj, 'DEBUG_INFORMATION_FORMAT': 'dwarf', 'ENABLE_TESTABILITY': 'YES', 'GCC_OPTIMIZATION_LEVEL': '0', 'ONLY_ACTIVE_ARCH': 'YES',
                  'SWIFT_ACTIVE_COMPILATION_CONDITIONS': 'DEBUG', 'SWIFT_OPTIMIZATION_LEVEL': '-Onone', 'GCC_PREPROCESSOR_DEFINITIONS': 'DEBUG=1 $(inherited)'})
cfg(PR, 'Release', {**proj, 'DEBUG_INFORMATION_FORMAT': 'dwarf-with-dsym', 'ENABLE_NS_ASSERTIONS': 'NO', 'SWIFT_COMPILATION_MODE': 'wholemodule', 'VALIDATE_PRODUCT': 'YES'})
tgt = dict(ASSETCATALOG_COMPILER_APPICON_NAME='AppIcon', ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME='AccentColor', CODE_SIGN_STYLE='Automatic',
           CURRENT_PROJECT_VERSION='1', DEVELOPMENT_TEAM='', GENERATE_INFOPLIST_FILE='YES', INFOPLIST_KEY_CFBundleDisplayName='slopgang',
           INFOPLIST_KEY_UIApplicationSceneManifest_Generation='YES', INFOPLIST_KEY_UILaunchScreen_Generation='YES',
           INFOPLIST_KEY_UIStatusBarStyle='UIStatusBarStyleLightContent',
           INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone='UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight',
           INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad='UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight',
           INFOPLIST_FILE='Slopgang/Info.plist', LD_RUNPATH_SEARCH_PATHS='$(inherited) @executable_path/Frameworks', MARKETING_VERSION='0.1.0',
           PRODUCT_BUNDLE_IDENTIFIER='org.slopgang.app', PRODUCT_NAME='$(TARGET_NAME)', SWIFT_EMIT_LOC_STRINGS='YES', SWIFT_VERSION='5.0', TARGETED_DEVICE_FAMILY='1,2')
cfg(TD, 'Debug', tgt); cfg(TR, 'Release', tgt)
w('/* End XCBuildConfiguration section */\n\n/* Begin XCConfigurationList section */\n')
for i, a, b in [(PCL, PD, PR), (TCL, TD, TR)]:
    w(f'\t\t{i} = {{\n\t\t\tisa = XCConfigurationList;\n\t\t\tbuildConfigurations = (\n\t\t\t\t{a} /* Debug */,\n\t\t\t\t{b} /* Release */,\n\t\t\t);\n\t\t\tdefaultConfigurationIsVisible = 0;\n\t\t\tdefaultConfigurationName = Release;\n\t\t}};\n')
w('/* End XCConfigurationList section */\n\t};\n\trootObject = ' + P + ' /* Project object */;\n}\n')
out = os.path.join(here, 'Slopgang.xcodeproj')
os.makedirs(os.path.join(out, 'project.xcworkspace'), exist_ok=True)
open(os.path.join(out, 'project.pbxproj'), 'w').write(''.join(L))
open(os.path.join(out, 'project.xcworkspace', 'contents.xcworkspacedata'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<Workspace\n   version = "1.0">\n   <FileRef\n      location = "self:">\n   </FileRef>\n</Workspace>\n')
sd = os.path.join(out, 'xcshareddata', 'xcschemes'); os.makedirs(sd, exist_ok=True)
ref = f'<BuildableReference BuildableIdentifier = "primary" BlueprintIdentifier = "{T}" BuildableName = "Slopgang.app" BlueprintName = "Slopgang" ReferencedContainer = "container:Slopgang.xcodeproj"></BuildableReference>'
open(os.path.join(sd, 'Slopgang.xcscheme'), 'w').write(f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion = "1500" version = "1.7">
   <BuildAction parallelizeBuildables = "YES" buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry buildForTesting = "YES" buildForRunning = "YES" buildForProfiling = "YES" buildForArchiving = "YES" buildForAnalyzing = "YES">
            {ref}
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <LaunchAction buildConfiguration = "Debug" selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB" launchStyle = "0" useCustomWorkingDirectory = "NO" ignoresPersistentStateOnLaunch = "NO" debugDocumentVersioning = "YES" debugServiceExtension = "internal" allowLocationSimulation = "YES">
      <BuildableProductRunnable runnableDebuggingMode = "0">
         {ref}
      </BuildableProductRunnable>
   </LaunchAction>
   <ArchiveAction buildConfiguration = "Release" revealArchiveInOrganizer = "YES"></ArchiveAction>
</Scheme>
''')
print('wrote', out, len(swift), 'swift files')
